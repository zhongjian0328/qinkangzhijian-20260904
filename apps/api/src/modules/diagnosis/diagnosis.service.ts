import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { AIResult } from '@qinkang/types';

// AI 服务返回的原始结构（Python 端为 snake_case）
interface RawAIResult {
  disease: string;
  probability: number;
  description: string;
  recommendations: string[];
  severity: string;
  differential_diagnoses?: { disease: string; probability: number }[];
}

@Injectable()
export class DiagnosisService {
  private readonly logger = new Logger(DiagnosisService.name);

  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: { imageUrl: string; species: string; symptoms: string[] }) {
    const diagnosis = await this.prisma.diagnosis.create({
      data: {
        userId,
        imageUrl: dto.imageUrl,
        species: dto.species as any,
        symptoms: dto.symptoms,
        confidence: 0,
        aiResult: {
          disease: '',
          probability: 0,
          description: '',
          recommendations: [],
          severity: 'low',
          differentialDiagnoses: [],
        },
        status: 'pending',
      },
    });

    // 后台异步分析，不阻塞创建响应
    this.analyze(diagnosis.id, dto).catch((err) =>
      this.logger.error(`诊断分析失败 #${diagnosis.id}: ${err.message}`),
    );

    return diagnosis;
  }

  async analyze(
    diagnosisId: string,
    dto: { imageUrl: string; species: string; symptoms: string[] },
  ): Promise<AIResult> {
    const aiServiceUrl = process.env.AI_SERVICE_URL ?? 'http://localhost:5000';
    const response = await fetch(`${aiServiceUrl}/diagnose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: dto.imageUrl,
        species: dto.species,
        symptoms: dto.symptoms,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI服务返回 ${response.status}: ${await response.text()}`);
    }

    const raw = (await response.json()) as RawAIResult;
    const result: AIResult = {
      disease: raw.disease,
      probability: raw.probability,
      description: raw.description,
      recommendations: raw.recommendations ?? [],
      severity: (raw.severity as AIResult['severity']) ?? 'low',
      differentialDiagnoses: (raw.differential_diagnoses ?? []).map((d) => ({
        disease: d.disease,
        probability: d.probability,
      })),
    };

    await this.updateAIResult(diagnosisId, result);
    return result;
  }

  async findByUser(userId: string) {
    return this.prisma.diagnosis.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async findById(id: string) {
    const diagnosis = await this.prisma.diagnosis.findUnique({
      where: { id },
      include: { user: { select: { id: true, username: true } } },
    });
    if (!diagnosis) throw new Error('诊断记录不存在');
    return diagnosis;
  }

  async updateAIResult(diagnosisId: string, result: AIResult) {
    return this.prisma.diagnosis.update({
      where: { id: diagnosisId },
      data: {
        aiResult: result as any,
        confidence: result.probability,
        status: 'completed',
      },
    });
  }
}
