import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class EpidemicService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: any) {
    if (!dto.location?.trim()) throw new BadRequestException('请填写发生地点');
    if (!dto.disease?.trim()) throw new BadRequestException('请填写疑似疾病');

    const affectedCount = Number(dto.affectedCount);
    if (Number.isNaN(affectedCount) || affectedCount <= 0) {
      throw new BadRequestException('请填写正确的发病数量');
    }
    const deathCount = Math.max(0, Number(dto.deathCount) || 0);
    const level = ['suspected', 'confirmed', 'controlled'].includes(dto.level)
      ? dto.level
      : 'suspected';

    return this.prisma.epidemicRecord.create({
      data: {
        userId,
        location: dto.location.trim(),
        province: dto.province ?? null,
        city: dto.city ?? null,
        district: dto.district ?? null,
        disease: dto.disease.trim(),
        affectedCount,
        deathCount,
        symptoms: dto.symptoms ?? null,
        level,
        reportedAt: dto.reportedAt ? new Date(dto.reportedAt) : new Date(),
      },
    });
  }

  async list(userId: string) {
    return this.prisma.epidemicRecord.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async findById(userId: string, id: string) {
    const record = await this.prisma.epidemicRecord.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('上报记录不存在');
    if (record.userId !== userId) throw new ForbiddenException('无权查看该记录');
    return record;
  }

  async update(userId: string, id: string, dto: any) {
    const record = await this.prisma.epidemicRecord.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('上报记录不存在');
    if (record.userId !== userId) throw new ForbiddenException('无权修改该记录');

    const data: Record<string, unknown> = {};
    if (dto.level !== undefined) {
      if (!['suspected', 'confirmed', 'controlled'].includes(dto.level)) {
        throw new BadRequestException('疫情级别不合法');
      }
      data.level = dto.level;
    }
    if (dto.disease !== undefined) data.disease = dto.disease;
    if (dto.affectedCount !== undefined) data.affectedCount = Number(dto.affectedCount);
    if (dto.deathCount !== undefined) data.deathCount = Math.max(0, Number(dto.deathCount) || 0);
    if (dto.symptoms !== undefined) data.symptoms = dto.symptoms;

    return this.prisma.epidemicRecord.update({ where: { id }, data });
  }

  async remove(userId: string, id: string) {
    const record = await this.prisma.epidemicRecord.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('上报记录不存在');
    if (record.userId !== userId) throw new ForbiddenException('无权删除该记录');
    await this.prisma.epidemicRecord.delete({ where: { id } });
    return { success: true };
  }

  /** 区域疫情聚合统计（匿名聚合，供疫控/科研/所有用户查看趋势） */
  async statistics() {
    const [total, byLevel, byDisease, byRegion] = await Promise.all([
      this.prisma.epidemicRecord.aggregate({
        _count: true,
        _sum: { affectedCount: true, deathCount: true },
      }),
      this.prisma.epidemicRecord.groupBy({
        by: ['level'],
        _count: true,
        _sum: { affectedCount: true, deathCount: true },
      }),
      this.prisma.epidemicRecord.groupBy({
        by: ['disease'],
        _count: true,
        _sum: { affectedCount: true, deathCount: true },
      }),
      this.prisma.epidemicRecord.groupBy({
        by: ['city'],
        _count: true,
        _sum: { affectedCount: true, deathCount: true },
        where: { city: { not: null } },
      }),
    ]);

    return {
      total: {
        count: total._count,
        affected: total._sum.affectedCount ?? 0,
        death: total._sum.deathCount ?? 0,
      },
      byLevel: byLevel
        .map((g) => ({
          level: g.level,
          count: g._count,
          affected: g._sum.affectedCount ?? 0,
          death: g._sum.deathCount ?? 0,
        }))
        .sort((a, b) => b.count - a.count),
      byDisease: byDisease
        .map((g) => ({
          disease: g.disease,
          count: g._count,
          affected: g._sum.affectedCount ?? 0,
          death: g._sum.deathCount ?? 0,
        }))
        .sort((a, b) => b.count - a.count),
      byRegion: byRegion
        .map((g) => ({
          city: g.city,
          count: g._count,
          affected: g._sum.affectedCount ?? 0,
          death: g._sum.deathCount ?? 0,
        }))
        .sort((a, b) => b.count - a.count),
    };
  }
}
