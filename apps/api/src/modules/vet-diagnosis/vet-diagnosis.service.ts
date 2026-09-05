import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { promises as fs } from 'fs';
import { join, basename } from 'path';
import { PrismaService } from '../../common/prisma.service';
import { UPLOAD_DIR } from '../../common/upload.config';
import { VetDiagnosisResult } from '@qinkang/types';

// AI 服务返回的原始结构（Python 端为 snake_case）
interface RawVetResult {
  disease: string;
  confidence: number;
  severity: string;
  primary: { disease: string; confidence: number };
  secondaries: { disease: string; confidence: number }[];
  excluded: string[];
  evidence: string[];
  differential_tests: string[];
  treatment: {
    emergency: string[];
    medication: string[];
    immunization: string[];
    disinfection: string[];
    management: string[];
  };
  followup: string[];
  disclaimer: string;
  risk_warning: string | null;
}

const EXT_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
};

function mimeFromUrl(url: string): string {
  const ext = basename(url).split('.').pop()?.toLowerCase() ?? 'jpg';
  return EXT_MIME[ext] ?? 'image/jpeg';
}

@Injectable()
export class VetDiagnosisService {
  private readonly logger = new Logger(VetDiagnosisService.name);

  constructor(private prisma: PrismaService) {}

  private aiUrl() {
    return process.env.AI_SERVICE_URL ?? 'http://localhost:5000';
  }

  private genCaseNo(): string {
    return `case_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  }

  private async readAsDataUri(url: string): Promise<string> {
    if (url.startsWith('data:')) return url;
    const buf = await fs.readFile(join(UPLOAD_DIR, basename(url)));
    return `data:${mimeFromUrl(url)};base64,${buf.toString('base64')}`;
  }

  async createCase(
    userId: string,
    dto: Record<string, any>,
  ) {
    const vc = await this.prisma.vetCase.create({
      data: {
        userId,
        caseNo: this.genCaseNo(),
        species: dto.species ?? 'chicken',
        status: 'submitted',
        basicInfo: dto.basicInfo ?? null,
        chiefComplaint: dto.chiefComplaint ?? null,
        clinicalSymptoms: dto.clinicalSymptoms ?? null,
        necropsyLesions: dto.necropsyLesions ?? null,
        labTests: dto.labTests ?? null,
        immuneHistory: dto.immuneHistory ?? null,
        medicationHistory: dto.medicationHistory ?? null,
        environment: dto.environment ?? null,
        epidemiology: dto.epidemiology ?? null,
        imageUrls: dto.imageUrls ?? [],
      },
    });

    // 后台异步调用 AI 深度诊断（不阻塞创建响应）
    this.runAnalyze(vc.id, dto.role, dto.subRole).catch((err) => {
      this.logger.error(`AI兽医诊断失败 #${vc.id}: ${err.message}`);
      return this.prisma.vetCase
        .update({ where: { id: vc.id }, data: { status: 'failed' } })
        .catch(() => {});
    });

    return vc;
  }

  async retryDiagnose(userId: string, caseId: string, role?: string, subRole?: string) {
    const vc = await this.findOwned(userId, caseId);
    this.runAnalyze(vc.id, role, subRole).catch((err) => {
      this.logger.error(`AI兽医诊断重试失败 #${vc.id}: ${err.message}`);
      return this.prisma.vetCase
        .update({ where: { id: vc.id }, data: { status: 'failed' } })
        .catch(() => {});
    });
    return this.prisma.vetCase.update({
      where: { id: vc.id },
      data: { status: 'analyzing' },
    });
  }

  private async runAnalyze(caseId: string, role?: string, subRole?: string) {
    const vc = await this.prisma.vetCase.findUnique({ where: { id: caseId } });
    if (!vc) return;

    await this.prisma.vetCase.update({
      where: { id: caseId },
      data: { status: 'analyzing' },
    });

    const imageDataUris = await Promise.all(
      (vc.imageUrls ?? []).map((url) => this.readAsDataUri(url)),
    );

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);
    let response: Response;
    try {
      response = await fetch(`${this.aiUrl()}/vet-diagnose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          species: vc.species,
          basic_info: vc.basicInfo,
          chief_complaint: vc.chiefComplaint,
          clinical_symptoms: vc.clinicalSymptoms,
          necropsy_lesions: vc.necropsyLesions,
          lab_tests: vc.labTests,
          immune_history: vc.immuneHistory,
          medication_history: vc.medicationHistory,
          environment: vc.environment,
          epidemiology: vc.epidemiology,
          image_urls: imageDataUris,
          role: role ?? 'farmer',
          sub_role: subRole ?? '',
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      throw new Error(`AI服务返回 ${response.status}: ${await response.text()}`);
    }

    const raw = (await response.json()) as RawVetResult;
    const result = this.mapResult(raw);

    await this.prisma.vetCase.update({
      where: { id: caseId },
      data: {
        status: 'completed',
        diagnosisEngine: 'doubao_2_1_turbo',
        diagnosisResult: result as any,
        confidence: result.confidence,
      },
    });
  }

  private mapResult(raw: RawVetResult): VetDiagnosisResult {
    const treatment = raw.treatment ?? {};
    return {
      disease: raw.disease,
      confidence: raw.confidence ?? 0,
      severity: (raw.severity as VetDiagnosisResult['severity']) ?? 'medium',
      primary: raw.primary ?? { disease: raw.disease, confidence: raw.confidence ?? 0 },
      secondaries: raw.secondaries ?? [],
      excluded: raw.excluded ?? [],
      evidence: raw.evidence ?? [],
      differentialTests: raw.differential_tests ?? [],
      treatment: {
        emergency: treatment.emergency ?? [],
        medication: treatment.medication ?? [],
        immunization: treatment.immunization ?? [],
        disinfection: treatment.disinfection ?? [],
        management: treatment.management ?? [],
      },
      followup: raw.followup ?? [],
      disclaimer: raw.disclaimer ?? '本报告由AI生成，仅供参考，不能替代执业兽医诊断。',
      riskWarning: raw.risk_warning ?? null,
    };
  }

  async saveOffline(userId: string, dto: Record<string, any>) {
    return this.prisma.vetCase.create({
      data: {
        userId,
        caseNo: this.genCaseNo(),
        species: dto.species ?? 'chicken',
        status: 'offline',
        basicInfo: dto.basicInfo ?? null,
        chiefComplaint: dto.chiefComplaint ?? null,
        clinicalSymptoms: dto.clinicalSymptoms ?? null,
        necropsyLesions: dto.necropsyLesions ?? null,
        labTests: dto.labTests ?? null,
        immuneHistory: dto.immuneHistory ?? null,
        medicationHistory: dto.medicationHistory ?? null,
        environment: dto.environment ?? null,
        epidemiology: dto.epidemiology ?? null,
        imageUrls: dto.imageUrls ?? [],
        diagnosisEngine: 'offline_rule',
        diagnosisResult: (dto.diagnosisResult ?? null) as any,
        confidence: dto.confidence ?? null,
      },
    });
  }

  private async findOwned(userId: string, id: string) {
    const vc = await this.prisma.vetCase.findUnique({ where: { id } });
    if (!vc) throw new NotFoundException('病例不存在');
    if (vc.userId !== userId) throw new BadRequestException('无权访问该病例');
    return vc;
  }

  async list(userId: string, take = 30, skip = 0) {
    return this.prisma.vetCase.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    });
  }

  async findById(userId: string, id: string) {
    return this.findOwned(userId, id);
  }

  async feedback(userId: string, id: string, feedback: string) {
    const vc = await this.findOwned(userId, id);
    return this.prisma.vetCase.update({
      where: { id: vc.id },
      data: { feedback },
    });
  }
}