import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

const CDC_ROLES = ['institution', 'admin'];
const STATUSES = ['investigating', 'processing', 'completed'];

type AuthedUser = { id: string; role: string; subRole?: string | null };

@Injectable()
export class EpidemiologyService {
  constructor(private prisma: PrismaService) {}

  private requireCdc(user: AuthedUser) {
    if (!CDC_ROLES.includes(user.role)) {
      throw new ForbiddenException('仅疫控机构可管理流调记录');
    }
  }

  async create(user: AuthedUser, dto: any) {
    this.requireCdc(user);
    if (!dto.title?.trim()) throw new BadRequestException('流调标题不能为空');
    if (!dto.disease?.trim()) throw new BadRequestException('流调病种不能为空');
    return this.prisma.epidemiology.create({
      data: {
        userId: user.id,
        title: dto.title.trim(),
        disease: dto.disease.trim(),
        province: dto.province ?? null,
        city: dto.city ?? null,
        district: dto.district ?? null,
        source: dto.source ?? null,
        transmissionChain: dto.transmissionChain ?? null,
        zones: dto.zones ?? undefined,
        measures: Array.isArray(dto.measures) ? dto.measures : [],
        status: STATUSES.includes(dto.status) ? dto.status : 'investigating',
        conclusion: dto.conclusion ?? null,
      },
    });
  }

  async list(user: AuthedUser, status?: string) {
    this.requireCdc(user);
    const where: any = { userId: user.id };
    if (status && STATUSES.includes(status)) where.status = status;
    return this.prisma.epidemiology.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async stats(user: AuthedUser) {
    this.requireCdc(user);
    const [total, investigating, processing, completed] = await Promise.all([
      this.prisma.epidemiology.count({ where: { userId: user.id } }),
      this.prisma.epidemiology.count({ where: { userId: user.id, status: 'investigating' } }),
      this.prisma.epidemiology.count({ where: { userId: user.id, status: 'processing' } }),
      this.prisma.epidemiology.count({ where: { userId: user.id, status: 'completed' } }),
    ]);
    return { total, investigating, processing, completed };
  }

  async findOne(user: AuthedUser, id: string) {
    this.requireCdc(user);
    const item = await this.prisma.epidemiology.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('流调记录不存在');
    if (item.userId !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('无权查看该流调记录');
    }
    return item;
  }

  async update(user: AuthedUser, id: string, dto: any) {
    this.requireCdc(user);
    const item = await this.prisma.epidemiology.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('流调记录不存在');
    if (item.userId !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('无权修改该流调记录');
    }
    const data: any = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.disease !== undefined) data.disease = dto.disease;
    if (dto.province !== undefined) data.province = dto.province ?? null;
    if (dto.city !== undefined) data.city = dto.city ?? null;
    if (dto.district !== undefined) data.district = dto.district ?? null;
    if (dto.source !== undefined) data.source = dto.source ?? null;
    if (dto.transmissionChain !== undefined) data.transmissionChain = dto.transmissionChain ?? null;
    if (dto.zones !== undefined) data.zones = dto.zones;
    if (dto.measures !== undefined) data.measures = Array.isArray(dto.measures) ? dto.measures : item.measures;
    if (dto.status !== undefined) data.status = STATUSES.includes(dto.status) ? dto.status : item.status;
    if (dto.conclusion !== undefined) data.conclusion = dto.conclusion ?? null;
    return this.prisma.epidemiology.update({ where: { id }, data });
  }

  async remove(user: AuthedUser, id: string) {
    this.requireCdc(user);
    const item = await this.prisma.epidemiology.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('流调记录不存在');
    if (item.userId !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('无权删除该流调记录');
    }
    await this.prisma.epidemiology.delete({ where: { id } });
    return { success: true };
  }
}
