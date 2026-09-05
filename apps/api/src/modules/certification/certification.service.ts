import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

type AuthedUser = { id: string; role: string; subRole?: string | null };

const VALID_TYPES = ['farmer', 'vet', 'merchant', 'institution', 'student'];

function mapRoleToType(user: AuthedUser): string {
  switch (user.role) {
    case 'merchant':
      return 'merchant';
    case 'vet':
    case 'technician':
      return 'vet';
    case 'institution':
      return 'institution';
    case 'student':
      return 'student';
    default:
      return 'farmer';
  }
}

function isReviewer(user: AuthedUser): boolean {
  return user.role === 'admin' || user.role === 'institution';
}

@Injectable()
export class CertificationService {
  constructor(private prisma: PrismaService) {}

  async submit(user: AuthedUser, dto: { type?: string; data?: Record<string, string>; images?: string[] }) {
    const type = dto.type ?? mapRoleToType(user);
    if (!VALID_TYPES.includes(type)) throw new BadRequestException('无效的认证类型');
    if (!dto.data || Object.keys(dto.data).length === 0) throw new BadRequestException('认证信息不能为空');

    const payload = {
      type: type as any,
      data: dto.data as any,
      images: dto.images ?? [],
      status: 'pending' as const,
      reviewerNote: null,
      reviewedAt: null,
    };

    const existing = await this.prisma.certification.findUnique({ where: { userId: user.id } });
    if (existing) {
      return this.prisma.certification.update({ where: { userId: user.id }, data: payload });
    }
    return this.prisma.certification.create({ data: { userId: user.id, ...payload } });
  }

  async getMine(userId: string) {
    const cert = await this.prisma.certification.findUnique({ where: { userId } });
    return cert ?? null;
  }

  async listPending(user: AuthedUser) {
    if (!isReviewer(user)) throw new ForbiddenException('无权查看认证审核列表');
    return this.prisma.certification.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { id: true, username: true, phone: true, role: true, subRole: true } } },
    });
  }

  async review(id: string, user: AuthedUser, dto: { status?: string; reviewerNote?: string }) {
    if (!isReviewer(user)) throw new ForbiddenException('无权审核认证');
    if (!['approved', 'rejected'].includes(dto.status ?? '')) throw new BadRequestException('审核结果无效');

    const cert = await this.prisma.certification.findUnique({ where: { id } });
    if (!cert) throw new NotFoundException('认证记录不存在');

    const updated = await this.prisma.certification.update({
      where: { id },
      data: { status: dto.status as any, reviewerNote: dto.reviewerNote ?? null, reviewedAt: new Date() },
    });

    await this.prisma.notification.create({
      data: {
        userId: cert.userId,
        type: 'system',
        title: dto.status === 'approved' ? '身份认证已通过' : '身份认证被驳回',
        content:
          dto.status === 'approved'
            ? '恭喜！您的身份认证已审核通过，现已解锁对应角色的全部功能。'
            : `您的身份认证未通过审核${dto.reviewerNote ? `：${dto.reviewerNote}` : ''}，请修改后重新提交。`,
        data: { certificationId: cert.id },
      },
    });

    return updated;
  }
}
