import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

const FARM_ROLES = ['farmer', 'admin'];
const METHODS = ['injection', 'water', 'drop_eye', 'drop_nose', 'spray', 'other'];
const STATUSES = ['planned', 'completed', 'overdue'];
const DUE_SOON_DAYS = 7;

type AuthedUser = { id: string; role: string; subRole?: string | null };

function toDate(v: unknown): Date | null {
  if (v == null || v === '') return null;
  const d = new Date(v as string);
  return isNaN(d.getTime()) ? null : d;
}

@Injectable()
export class ImmunizationService {
  constructor(private prisma: PrismaService) {}

  private requireFarmer(user: AuthedUser) {
    if (!FARM_ROLES.includes(user.role)) {
      throw new ForbiddenException('仅养殖户可管理免疫记录');
    }
  }

  async create(user: AuthedUser, dto: any) {
    this.requireFarmer(user);
    if (!dto.vaccineName?.trim()) throw new BadRequestException('疫苗名称不能为空');
    return this.prisma.immunization.create({
      data: {
        userId: user.id,
        houseId: dto.houseId ?? null,
        batchId: dto.batchId ?? null,
        vaccineName: dto.vaccineName.trim(),
        disease: dto.disease ?? null,
        method: METHODS.includes(dto.method) ? dto.method : 'injection',
        dosage: dto.dosage ?? null,
        immunizedCount: dto.immunizedCount != null ? Number(dto.immunizedCount) : 0,
        administeredAt: toDate(dto.administeredAt),
        nextDueAt: toDate(dto.nextDueAt),
        operator: dto.operator ?? null,
        vaccineBatch: dto.vaccineBatch ?? null,
        manufacturer: dto.manufacturer ?? null,
        status: STATUSES.includes(dto.status) ? dto.status : 'planned',
        notes: dto.notes ?? null,
      },
    });
  }

  async list(user: AuthedUser, status?: string) {
    this.requireFarmer(user);
    const where: any = { userId: user.id };
    if (status && STATUSES.includes(status)) where.status = status;
    return this.prisma.immunization.findMany({
      where,
      orderBy: [{ nextDueAt: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async stats(user: AuthedUser) {
    this.requireFarmer(user);
    const now = new Date();
    const dueSoonBoundary = new Date(now.getTime() + DUE_SOON_DAYS * 24 * 3600 * 1000);
    const [total, planned, completed, overdue, dueSoon] = await Promise.all([
      this.prisma.immunization.count({ where: { userId: user.id } }),
      this.prisma.immunization.count({ where: { userId: user.id, status: 'planned' } }),
      this.prisma.immunization.count({ where: { userId: user.id, status: 'completed' } }),
      this.prisma.immunization.count({ where: { userId: user.id, status: 'overdue' } }),
      this.prisma.immunization.count({
        where: {
          userId: user.id,
          status: 'planned',
          nextDueAt: { not: null, gt: now, lte: dueSoonBoundary },
        },
      }),
    ]);
    return { total, planned, completed, overdue, dueSoon };
  }

  async reminders(user: AuthedUser) {
    this.requireFarmer(user);
    const now = new Date();
    const dueSoonBoundary = new Date(now.getTime() + DUE_SOON_DAYS * 24 * 3600 * 1000);
    const [overdue, dueSoon] = await Promise.all([
      this.prisma.immunization.findMany({
        where: {
          userId: user.id,
          OR: [
            { status: 'overdue' },
            { status: 'planned', nextDueAt: { not: null, lte: now } },
          ],
        },
        orderBy: { nextDueAt: 'asc' },
      }),
      this.prisma.immunization.findMany({
        where: {
          userId: user.id,
          status: 'planned',
          nextDueAt: { not: null, gt: now, lte: dueSoonBoundary },
        },
        orderBy: { nextDueAt: 'asc' },
      }),
    ]);
    return { overdue, dueSoon };
  }

  async findOne(user: AuthedUser, id: string) {
    this.requireFarmer(user);
    const item = await this.prisma.immunization.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('免疫记录不存在');
    if (item.userId !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('无权查看该免疫记录');
    }
    return item;
  }

  async update(user: AuthedUser, id: string, dto: any) {
    this.requireFarmer(user);
    const item = await this.prisma.immunization.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('免疫记录不存在');
    if (item.userId !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('无权修改该免疫记录');
    }
    const data: any = {};
    if (dto.houseId !== undefined) data.houseId = dto.houseId ?? null;
    if (dto.batchId !== undefined) data.batchId = dto.batchId ?? null;
    if (dto.vaccineName !== undefined) data.vaccineName = dto.vaccineName.trim();
    if (dto.disease !== undefined) data.disease = dto.disease ?? null;
    if (dto.method !== undefined) data.method = METHODS.includes(dto.method) ? dto.method : item.method;
    if (dto.dosage !== undefined) data.dosage = dto.dosage ?? null;
    if (dto.immunizedCount !== undefined) data.immunizedCount = Number(dto.immunizedCount);
    if (dto.administeredAt !== undefined) data.administeredAt = toDate(dto.administeredAt);
    if (dto.nextDueAt !== undefined) data.nextDueAt = toDate(dto.nextDueAt);
    if (dto.operator !== undefined) data.operator = dto.operator ?? null;
    if (dto.vaccineBatch !== undefined) data.vaccineBatch = dto.vaccineBatch ?? null;
    if (dto.manufacturer !== undefined) data.manufacturer = dto.manufacturer ?? null;
    if (dto.status !== undefined) data.status = STATUSES.includes(dto.status) ? dto.status : item.status;
    if (dto.notes !== undefined) data.notes = dto.notes ?? null;
    return this.prisma.immunization.update({ where: { id }, data });
  }

  async remove(user: AuthedUser, id: string) {
    this.requireFarmer(user);
    const item = await this.prisma.immunization.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('免疫记录不存在');
    if (item.userId !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('无权删除该免疫记录');
    }
    await this.prisma.immunization.delete({ where: { id } });
    return { success: true };
  }
}
