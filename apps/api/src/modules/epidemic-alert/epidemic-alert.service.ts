import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

const CDC_ROLES = ['institution', 'admin'];
const LEVELS = ['general', 'major', 'severe'];
const STATUSES = ['active', 'resolved'];

const LEVEL_LABEL: Record<string, string> = {
  general: '一般',
  major: '较大',
  severe: '重大',
};

type AuthedUser = { id: string; role: string; subRole?: string | null };

@Injectable()
export class EpidemicAlertService {
  constructor(private prisma: PrismaService) {}

  private requireCdc(user: AuthedUser) {
    if (!CDC_ROLES.includes(user.role)) {
      throw new ForbiddenException('仅疫控机构可发布预警');
    }
  }

  private isTargeted(alert: { audience: unknown }, user: AuthedUser): boolean {
    const audience = alert.audience as string[];
    if (!Array.isArray(audience) || audience.length === 0) return true;
    return audience.includes(user.role);
  }

  async create(user: AuthedUser, dto: any) {
    this.requireCdc(user);
    if (!dto.title?.trim()) throw new BadRequestException('预警标题不能为空');
    if (!dto.disease?.trim()) throw new BadRequestException('预警病种不能为空');
    if (!dto.content?.trim()) throw new BadRequestException('预警内容不能为空');

    const audience = Array.isArray(dto.audience) ? dto.audience : [];
    const level = LEVELS.includes(dto.level) ? dto.level : 'general';

    const alert = await this.prisma.epidemicAlert.create({
      data: {
        userId: user.id,
        title: dto.title.trim(),
        disease: dto.disease.trim(),
        level,
        province: dto.province ?? null,
        city: dto.city ?? null,
        district: dto.district ?? null,
        content: dto.content.trim(),
        audience,
        status: STATUSES.includes(dto.status) ? dto.status : 'active',
      },
    });

    // 定向推送：按受众角色生成通知（空=全体角色）
    await this.fanoutNotifications({
      id: alert.id,
      title: alert.title,
      disease: alert.disease,
      level,
      audience,
    });

    return alert;
  }

  private async fanoutNotifications(alert: {
    id: string;
    title: string;
    disease: string;
    level: string;
    audience: string[];
  }) {
    const roles = (
      alert.audience.length > 0
        ? alert.audience
        : ['farmer', 'vet', 'technician', 'merchant', 'institution', 'student']
    ) as any[];
    const targets = await this.prisma.user.findMany({
      where: { role: { in: roles as any } },
      select: { id: true },
    });
    if (targets.length === 0) return;
    await this.prisma.notification.createMany({
      data: targets.map((t) => ({
        userId: t.id,
        type: 'warning',
        title: `【${LEVEL_LABEL[alert.level] ?? '一般'}疫情预警】${alert.title}`,
        content: `病种：${alert.disease}，请及时查看并采取防控措施。`,
        data: { alertId: alert.id },
      })),
    });
  }

  async list(user: AuthedUser) {
    const isCdc = CDC_ROLES.includes(user.role);
    const alerts = await this.prisma.epidemicAlert.findMany({
      where: isCdc ? {} : { status: 'active' },
      orderBy: { createdAt: 'desc' },
    });
    return alerts.filter((a) => isCdc || this.isTargeted(a, user));
  }

  async stats(user: AuthedUser) {
    this.requireCdc(user);
    const [total, active, resolved, severe, major, general] = await Promise.all([
      this.prisma.epidemicAlert.count(),
      this.prisma.epidemicAlert.count({ where: { status: 'active' } }),
      this.prisma.epidemicAlert.count({ where: { status: 'resolved' } }),
      this.prisma.epidemicAlert.count({ where: { level: 'severe' } }),
      this.prisma.epidemicAlert.count({ where: { level: 'major' } }),
      this.prisma.epidemicAlert.count({ where: { level: 'general' } }),
    ]);
    return { total, active, resolved, severe, major, general };
  }

  async findOne(user: AuthedUser, id: string) {
    const alert = await this.prisma.epidemicAlert.findUnique({ where: { id } });
    if (!alert) throw new NotFoundException('预警不存在');
    const isCdc = CDC_ROLES.includes(user.role);
    const isOwner = alert.userId === user.id;
    if (!isCdc && !isOwner && !this.isTargeted(alert, user)) {
      throw new ForbiddenException('该预警不面向您的角色');
    }
    return alert;
  }

  async update(user: AuthedUser, id: string, dto: any) {
    this.requireCdc(user);
    const alert = await this.prisma.epidemicAlert.findUnique({ where: { id } });
    if (!alert) throw new NotFoundException('预警不存在');
    if (alert.userId !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('无权修改该预警');
    }
    const data: any = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.disease !== undefined) data.disease = dto.disease;
    if (dto.level !== undefined) data.level = LEVELS.includes(dto.level) ? dto.level : alert.level;
    if (dto.province !== undefined) data.province = dto.province ?? null;
    if (dto.city !== undefined) data.city = dto.city ?? null;
    if (dto.district !== undefined) data.district = dto.district ?? null;
    if (dto.content !== undefined) data.content = dto.content;
    if (dto.audience !== undefined) data.audience = Array.isArray(dto.audience) ? dto.audience : alert.audience;
    if (dto.status !== undefined) data.status = STATUSES.includes(dto.status) ? dto.status : alert.status;
    return this.prisma.epidemicAlert.update({ where: { id }, data });
  }

  async remove(user: AuthedUser, id: string) {
    this.requireCdc(user);
    const alert = await this.prisma.epidemicAlert.findUnique({ where: { id } });
    if (!alert) throw new NotFoundException('预警不存在');
    if (alert.userId !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('无权删除该预警');
    }
    await this.prisma.epidemicAlert.delete({ where: { id } });
    return { success: true };
  }
}
