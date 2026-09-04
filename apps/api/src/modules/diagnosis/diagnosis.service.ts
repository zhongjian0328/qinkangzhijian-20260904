import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join, basename } from 'path';
import { PrismaService } from '../../common/prisma.service';
import { UPLOAD_DIR } from '../../common/upload.config';
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
export class DiagnosisService {
  private readonly logger = new Logger(DiagnosisService.name);

  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: { imageUrls: string[]; species: string; symptoms: string[] }) {
    if (!dto.imageUrls?.length) {
      throw new BadRequestException('请至少上传一张禽类照片');
    }

    const diagnosis = await this.prisma.diagnosis.create({
      data: {
        userId,
        imageUrls: dto.imageUrls,
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
    this.analyze(diagnosis.id, dto).catch((err) => {
      this.logger.error(`诊断分析失败 #${diagnosis.id}: ${err.message}`);
      return this.markFailed(diagnosis.id).catch(() => {});
    });

    return diagnosis;
  }

  /** 把落盘图片读出来转成 base64 data URI，供豆包多模态接口内联使用 */
  private async readAsDataUri(url: string): Promise<string> {
    if (url.startsWith('data:')) return url; // 兼容历史 base64 数据
    const buf = await fs.readFile(join(UPLOAD_DIR, basename(url)));
    return `data:${mimeFromUrl(url)};base64,${buf.toString('base64')}`;
  }

  async analyze(
    diagnosisId: string,
    dto: { imageUrls: string[]; species: string; symptoms: string[] },
  ): Promise<AIResult> {
    const imageDataUris = await Promise.all(
      (dto.imageUrls ?? []).map((url) => this.readAsDataUri(url)),
    );

    const aiServiceUrl = process.env.AI_SERVICE_URL ?? 'http://localhost:5000';
    const response = await fetch(`${aiServiceUrl}/diagnose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_urls: imageDataUris,
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

  async findByUser(userId: string, take = 20, skip = 0) {
    return this.prisma.diagnosis.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
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

  async markFailed(diagnosisId: string) {
    return this.prisma.diagnosis.update({
      where: { id: diagnosisId },
      data: { status: 'failed' },
    });
  }
}
