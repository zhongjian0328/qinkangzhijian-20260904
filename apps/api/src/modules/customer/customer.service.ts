import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

const VET_ROLES = ['vet', 'technician', 'admin'];
const LEVELS = ['vip', 'regular', 'potential'];

type AuthedUser = { id: string; role: string; subRole?: string | null };

function canManageCustomers(user: AuthedUser): boolean {
  if (VET_ROLES.includes(user.role) || user.role === 'merchant') return true;
  if (user.role === 'farmer' && ['enterprise', 'cooperative'].includes(user.subRole ?? '')) return true;
  return false;
}

@Injectable()
export class CustomerService {
  constructor(private prisma: PrismaService) {}

  private requireVet(user: AuthedUser) {
    if (!canManageCustomers(user)) {
      throw new ForbiddenException('仅兽医/技术员/企业/合作社/商家可管理客户');
    }
  }

  async create(user: AuthedUser, dto: any) {
    this.requireVet(user);
    if (!dto.name?.trim()) throw new BadRequestException('客户姓名不能为空');
    return this.prisma.customer.create({
      data: {
        ownerId: user.id,
        name: dto.name.trim(),
        phone: dto.phone ?? null,
        farmName: dto.farmName ?? null,
        species: dto.species ?? null,
        scale: dto.scale != null ? Number(dto.scale) : null,
        address: dto.address ?? null,
        level: LEVELS.includes(dto.level) ? dto.level : 'regular',
        notes: dto.notes ?? null,
        tags: Array.isArray(dto.tags) ? dto.tags : [],
        nextFollowUpAt: dto.nextFollowUpAt ? new Date(dto.nextFollowUpAt) : null,
      },
    });
  }

  async list(user: AuthedUser) {
    this.requireVet(user);
    const customers = await this.prisma.customer.findMany({
      where: { ownerId: user.id },
      orderBy: [{ nextFollowUpAt: 'asc' }, { createdAt: 'desc' }],
    });
    return customers;
  }

  async stats(user: AuthedUser) {
    this.requireVet(user);
    const now = new Date();
    const [total, vip, regular, potential, dueCount] = await Promise.all([
      this.prisma.customer.count({ where: { ownerId: user.id } }),
      this.prisma.customer.count({ where: { ownerId: user.id, level: 'vip' } }),
      this.prisma.customer.count({ where: { ownerId: user.id, level: 'regular' } }),
      this.prisma.customer.count({ where: { ownerId: user.id, level: 'potential' } }),
      this.prisma.customer.count({
        where: { ownerId: user.id, nextFollowUpAt: { not: null, lte: now } },
      }),
    ]);
    return { total, vip, regular, potential, dueCount };
  }

  async findOne(user: AuthedUser, id: string) {
    this.requireVet(user);
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new NotFoundException('客户不存在');
    if (customer.ownerId !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('无权查看该客户');
    }
    return customer;
  }

  async update(user: AuthedUser, id: string, dto: any) {
    this.requireVet(user);
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new NotFoundException('客户不存在');
    if (customer.ownerId !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('无权修改该客户');
    }
    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.farmName !== undefined) data.farmName = dto.farmName;
    if (dto.species !== undefined) data.species = dto.species;
    if (dto.scale !== undefined) data.scale = dto.scale != null ? Number(dto.scale) : null;
    if (dto.address !== undefined) data.address = dto.address;
    if (dto.level !== undefined) data.level = LEVELS.includes(dto.level) ? dto.level : customer.level;
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.tags !== undefined) data.tags = Array.isArray(dto.tags) ? dto.tags : customer.tags;
    if (dto.nextFollowUpAt !== undefined) {
      data.nextFollowUpAt = dto.nextFollowUpAt ? new Date(dto.nextFollowUpAt) : null;
    }
    return this.prisma.customer.update({ where: { id }, data });
  }

  async remove(user: AuthedUser, id: string) {
    this.requireVet(user);
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new NotFoundException('客户不存在');
    if (customer.ownerId !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('无权删除该客户');
    }
    await this.prisma.customer.delete({ where: { id } });
    return { success: true };
  }
}
