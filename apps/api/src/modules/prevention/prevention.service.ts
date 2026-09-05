import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

// AI 服务返回 snake_case，映射为前端 camelCase
const CAMEL_MAP: Record<string, string> = {
  diagnosis_summary: 'diagnosisSummary',
  emergency_measures: 'emergencyMeasures',
  green_medication: 'greenMedication',
  immunization: 'immunization',
  biosafety: 'biosafety',
  monitoring_plan: 'monitoringPlan',
  follow_up_notes: 'followUpNotes',
};

function mapContent(raw: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw ?? {})) {
    out[CAMEL_MAP[k] ?? k] = v;
  }
  return out;
}

@Injectable()
export class PreventionService {
  private readonly logger = new Logger(PreventionService.name);

  constructor(private prisma: PrismaService) {}

  private aiUrl() {
    return process.env.AI_SERVICE_URL ?? 'http://localhost:5000';
  }

  async generate(userId: string, diagnosisId: string) {
    const diagnosis = await this.assertDiagnosisOwnership(userId, diagnosisId);

    const aiResult = diagnosis.aiResult as any;
    if (diagnosis.status !== 'completed' || !aiResult?.disease) {
      throw new BadRequestException('诊断尚未完成，暂不能生成防控预案');
    }

    // 幂等：同一诊断只生成一份预案
    const existing = await this.prisma.preventionPlan.findUnique({
      where: { diagnosisId },
    });
    if (existing) {
      return this.getByDiagnosis(userId, diagnosisId);
    }

    const response = await fetch(`${this.aiUrl()}/prevention/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        diagnosis: aiResult,
        species: diagnosis.species,
        symptoms: diagnosis.symptoms ?? [],
      }),
    });

    if (!response.ok) {
      throw new BadRequestException(`AI服务返回 ${response.status}: ${await response.text()}`);
    }

    const raw = await response.json();
    const content = mapContent(raw);

    return this.prisma.preventionPlan.create({
      data: {
        userId,
        diagnosisId,
        content: content as any,
        followUps: {
          create: [
            { dayOffset: 3, status: 'pending' },
            { dayOffset: 7, status: 'pending' },
          ],
        },
      },
      include: { followUps: { orderBy: { dayOffset: 'asc' } } },
    });
  }

  async getByDiagnosis(userId: string, diagnosisId: string) {
    const plan = await this.prisma.preventionPlan.findUnique({
      where: { diagnosisId },
      include: { followUps: { orderBy: { dayOffset: 'asc' } } },
    });
    if (!plan) throw new NotFoundException('防控预案不存在，请先生成');
    if (plan.userId !== userId) throw new ForbiddenException('无权查看该预案');
    return plan;
  }

  async list(userId: string) {
    const plans = await this.prisma.preventionPlan.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        diagnosis: { select: { aiResult: true, createdAt: true } },
      },
    });

    return plans.map((p) => {
      const ai = p.diagnosis?.aiResult as any;
      return {
        ...p,
        diagnosis: {
          disease: ai?.disease ?? '',
          severity: ai?.severity ?? 'low',
          createdAt: p.diagnosis?.createdAt,
        },
      };
    });
  }

  async addFollowup(userId: string, planId: string, dto: any) {
    await this.assertPlanOwnership(userId, planId);

    const dayOffset = Number(dto.dayOffset);
    if (dayOffset !== 3 && dayOffset !== 7) {
      throw new BadRequestException('回访时间点应为 3 日或 7 日');
    }

    const data: Record<string, unknown> = { notes: dto.notes ?? null };
    if (dto.status === 'completed') {
      data.status = 'completed';
      data.completedAt = new Date();
    } else if (dto.status === 'pending') {
      data.status = 'pending';
      data.completedAt = null;
    }

    const existing = await this.prisma.followUp.findFirst({
      where: { planId, dayOffset },
    });
    if (existing) {
      return this.prisma.followUp.update({ where: { id: existing.id }, data });
    }
    return this.prisma.followUp.create({
      data: { planId, dayOffset, ...data },
    });
  }

  async listFollowups(userId: string, planId: string) {
    await this.assertPlanOwnership(userId, planId);
    return this.prisma.followUp.findMany({
      where: { planId },
      orderBy: { dayOffset: 'asc' },
    });
  }

  private async assertDiagnosisOwnership(userId: string, id: string) {
    const diagnosis = await this.prisma.diagnosis.findUnique({ where: { id } });
    if (!diagnosis) throw new NotFoundException('诊断记录不存在');
    if (diagnosis.userId !== userId) throw new ForbiddenException('无权操作该诊断');
    return diagnosis;
  }

  private async assertPlanOwnership(userId: string, id: string) {
    const plan = await this.prisma.preventionPlan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('防控预案不存在');
    if (plan.userId !== userId) throw new ForbiddenException('无权操作该预案');
    return plan;
  }
}
