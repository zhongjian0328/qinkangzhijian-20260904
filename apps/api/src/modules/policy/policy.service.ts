import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

const POLICY_ROLES = ['institution', 'admin'];
const CATEGORIES = ['prevention_plan', 'immunization', 'medication', 'notice', 'other'];
const STATUSES = ['draft', 'published', 'archived'];

type AuthedUser = { id: string; role: string; subRole?: string | null };

@Injectable()
export class PolicyService {
  constructor(private prisma: PrismaService) {}

  private canPublish(user: AuthedUser) {
    if (!POLICY_ROLES.includes(user.role)) {
      throw new ForbiddenException('仅疫控机构可发布政策');
    }
  }

  private isTargeted(policy: { audience: unknown }, user: AuthedUser): boolean {
    const audience = policy.audience as string[];
    if (!Array.isArray(audience) || audience.length === 0) return true;
    return audience.includes(user.role);
  }

  async create(user: AuthedUser, dto: any) {
    this.canPublish(user);
    if (!dto.title?.trim()) throw new BadRequestException('政策标题不能为空');
    if (!dto.content?.trim()) throw new BadRequestException('政策内容不能为空');
    return this.prisma.policy.create({
      data: {
        userId: user.id,
        title: dto.title.trim(),
        category: CATEGORIES.includes(dto.category) ? dto.category : 'notice',
        content: dto.content.trim(),
        audience: Array.isArray(dto.audience) ? dto.audience : [],
        status: STATUSES.includes(dto.status) ? dto.status : 'published',
      },
    });
  }

  async list(user: AuthedUser) {
    const isPublisher = POLICY_ROLES.includes(user.role);
    const policies = await this.prisma.policy.findMany({
      where: isPublisher ? { userId: user.id } : { status: 'published' },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { reads: true } },
        reads: { where: { userId: user.id }, select: { id: true } },
      },
    });

    return policies
      .filter((p) => isPublisher || this.isTargeted(p, user))
      .map((p) => ({
        id: p.id,
        userId: p.userId,
        title: p.title,
        category: p.category,
        content: p.content,
        audience: p.audience,
        status: p.status,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        readCount: p._count.reads,
        read: p.reads.length > 0,
      }));
  }

  async stats(user: AuthedUser) {
    this.canPublish(user);
    const policies = await this.prisma.policy.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { reads: true } } },
    });
    return policies.map((p) => ({
      id: p.id,
      title: p.title,
      category: p.category,
      status: p.status,
      readCount: p._count.reads,
      createdAt: p.createdAt,
    }));
  }

  async findOne(user: AuthedUser, id: string) {
    const policy = await this.prisma.policy.findUnique({
      where: { id },
      include: {
        _count: { select: { reads: true } },
        reads: { where: { userId: user.id }, select: { id: true } },
      },
    });
    if (!policy) throw new NotFoundException('政策不存在');

    const isOwner = policy.userId === user.id;
    const isPublisher = POLICY_ROLES.includes(user.role);
    if (policy.status !== 'published' && !isOwner && !isPublisher) {
      throw new ForbiddenException('该政策尚未发布');
    }
    if (policy.status === 'published' && !this.isTargeted(policy, user) && !isOwner && !isPublisher) {
      throw new ForbiddenException('该政策不面向您的角色');
    }
    return {
      id: policy.id,
      userId: policy.userId,
      title: policy.title,
      category: policy.category,
      content: policy.content,
      audience: policy.audience,
      status: policy.status,
      createdAt: policy.createdAt,
      updatedAt: policy.updatedAt,
      readCount: policy._count.reads,
      read: policy.reads.length > 0,
    };
  }

  async markRead(user: AuthedUser, id: string) {
    const policy = await this.prisma.policy.findUnique({ where: { id } });
    if (!policy) throw new NotFoundException('政策不存在');
    await this.prisma.policyRead.upsert({
      where: { policyId_userId: { policyId: id, userId: user.id } },
      update: { readAt: new Date() },
      create: { policyId: id, userId: user.id },
    });
    return { success: true };
  }

  async update(user: AuthedUser, id: string, dto: any) {
    this.canPublish(user);
    const policy = await this.prisma.policy.findUnique({ where: { id } });
    if (!policy) throw new NotFoundException('政策不存在');
    if (policy.userId !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('无权修改该政策');
    }
    const data: any = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.category !== undefined) {
      data.category = CATEGORIES.includes(dto.category) ? dto.category : policy.category;
    }
    if (dto.content !== undefined) data.content = dto.content;
    if (dto.audience !== undefined) data.audience = Array.isArray(dto.audience) ? dto.audience : policy.audience;
    if (dto.status !== undefined) {
      data.status = STATUSES.includes(dto.status) ? dto.status : policy.status;
    }
    return this.prisma.policy.update({ where: { id }, data });
  }

  async remove(user: AuthedUser, id: string) {
    this.canPublish(user);
    const policy = await this.prisma.policy.findUnique({ where: { id } });
    if (!policy) throw new NotFoundException('政策不存在');
    if (policy.userId !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('无权删除该政策');
    }
    await this.prisma.policy.delete({ where: { id } });
    return { success: true };
  }
}
