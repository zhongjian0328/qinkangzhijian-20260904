import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class ProductionService {
  constructor(private prisma: PrismaService) {}

  async createBatch(userId: string, dto: any) {
    const quantity = Number(dto.quantity);
    if (!dto.batchNo?.trim()) throw new BadRequestException('请填写批次号');
    if (!dto.breed?.trim()) throw new BadRequestException('请填写品种');
    if (Number.isNaN(quantity) || quantity <= 0) {
      throw new BadRequestException('请填写正确的批次数量');
    }
    const startDate = dto.startDate ? new Date(dto.startDate) : new Date();
    if (Number.isNaN(startDate.getTime())) {
      throw new BadRequestException('开始日期不合法');
    }

    // 若关联禽舍，校验归属
    if (dto.houseId) {
      await this.assertHouseOwnership(userId, dto.houseId);
    }

    return this.prisma.batch.create({
      data: {
        userId,
        houseId: dto.houseId ?? null,
        batchNo: dto.batchNo.trim(),
        breed: dto.breed.trim(),
        quantity,
        startDate,
        notes: dto.notes ?? null,
      },
    });
  }

  async listBatches(userId: string) {
    return this.prisma.batch.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBatch(userId: string, id: string) {
    const batch = await this.assertBatchOwnership(userId, id);
    return this.prisma.batch.findUnique({
      where: { id },
      include: { dailyRecords: { orderBy: { recordDate: 'desc' } } },
    });
  }

  async updateBatch(userId: string, id: string, dto: any) {
    await this.assertBatchOwnership(userId, id);

    if (dto.houseId) {
      await this.assertHouseOwnership(userId, dto.houseId);
    }

    const data: Record<string, unknown> = {};
    if (dto.batchNo !== undefined) data.batchNo = dto.batchNo;
    if (dto.breed !== undefined) data.breed = dto.breed;
    if (dto.quantity !== undefined) data.quantity = Number(dto.quantity);
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.houseId !== undefined) data.houseId = dto.houseId;
    if (dto.startDate !== undefined) {
      const startDate = new Date(dto.startDate);
      if (!Number.isNaN(startDate.getTime())) data.startDate = startDate;
    }

    return this.prisma.batch.update({ where: { id }, data });
  }

  async removeBatch(userId: string, id: string) {
    await this.assertBatchOwnership(userId, id);
    // 先删每日记录（schema 已开 onDelete Cascade，这里显式删除更稳妥）
    await this.prisma.$transaction([
      this.prisma.dailyRecord.deleteMany({ where: { batchId: id } }),
      this.prisma.batch.delete({ where: { id } }),
    ]);
    return { success: true };
  }

  async addRecord(userId: string, batchId: string, dto: any) {
    const batch = await this.assertBatchOwnership(userId, batchId);

    const recordDate = dto.recordDate ? new Date(dto.recordDate) : new Date();
    if (Number.isNaN(recordDate.getTime())) {
      throw new BadRequestException('记录日期不合法');
    }

    const num = (v: any, fallback = 0) => {
      if (v == null || v === '') return fallback;
      const n = Number(v);
      return Number.isNaN(n) ? fallback : n;
    };

    return this.prisma.dailyRecord.create({
      data: {
        batchId,
        recordDate,
        deathCount: Math.max(0, Math.round(num(dto.deathCount))),
        cullCount: Math.max(0, Math.round(num(dto.cullCount))),
        feedAmount: Math.max(0, num(dto.feedAmount)),
        waterAmount: Math.max(0, num(dto.waterAmount)),
        eggCount: Math.max(0, Math.round(num(dto.eggCount))),
        temperature: dto.temperature != null && dto.temperature !== '' ? num(dto.temperature) : null,
        humidity: dto.humidity != null && dto.humidity !== '' ? num(dto.humidity) : null,
        notes: dto.notes ?? null,
      },
    });
  }

  async listRecords(userId: string, batchId: string) {
    await this.assertBatchOwnership(userId, batchId);
    return this.prisma.dailyRecord.findMany({
      where: { batchId },
      orderBy: { recordDate: 'desc' },
      take: 100,
    });
  }

  async removeRecord(userId: string, recordId: string) {
    const record = await this.prisma.dailyRecord.findUnique({ where: { id: recordId } });
    if (!record) throw new NotFoundException('记录不存在');
    await this.assertBatchOwnership(userId, record.batchId);
    return this.prisma.dailyRecord.delete({ where: { id: recordId } });
  }

  async dashboard(userId: string) {
    const [totalBatches, activeBatches, activeQuantity, agg] = await Promise.all([
      this.prisma.batch.count({ where: { userId } }),
      this.prisma.batch.count({ where: { userId, status: 'active' } }),
      this.prisma.batch.aggregate({
        where: { userId, status: 'active' },
        _sum: { quantity: true },
      }),
      this.prisma.dailyRecord.aggregate({
        where: { batch: { userId } },
        _sum: {
          deathCount: true,
          cullCount: true,
          eggCount: true,
        },
      }),
    ]);

    const latestRecords = await this.prisma.dailyRecord.findMany({
      where: { batch: { userId } },
      orderBy: { recordDate: 'desc' },
      take: 5,
      include: { batch: { select: { id: true, batchNo: true } } },
    });

    return {
      totalBatches,
      activeBatches,
      totalQuantity: activeQuantity._sum.quantity ?? 0,
      cumulativeDeaths: agg._sum.deathCount ?? 0,
      cumulativeCulls: agg._sum.cullCount ?? 0,
      cumulativeEggs: agg._sum.eggCount ?? 0,
      latestRecords: latestRecords.map((r) => ({
        batchId: r.batch.id,
        batchNo: r.batch.batchNo,
        record: {
          id: r.id,
          batchId: r.batchId,
          recordDate: r.recordDate,
          deathCount: r.deathCount,
          cullCount: r.cullCount,
          feedAmount: r.feedAmount,
          waterAmount: r.waterAmount,
          eggCount: r.eggCount,
          temperature: r.temperature,
          humidity: r.humidity,
          notes: r.notes,
          createdAt: r.createdAt,
        },
      })),
    };
  }

  private async assertBatchOwnership(userId: string, id: string) {
    const batch = await this.prisma.batch.findUnique({ where: { id } });
    if (!batch) throw new NotFoundException('批次不存在');
    if (batch.userId !== userId) throw new ForbiddenException('无权操作该批次');
    return batch;
  }

  private async assertHouseOwnership(userId: string, houseId: string) {
    const house = await this.prisma.poultryHouse.findUnique({ where: { id: houseId } });
    if (!house) throw new NotFoundException('禽舍不存在');
    if (house.userId !== userId) throw new ForbiddenException('无权关联该禽舍');
    return house;
  }
}
