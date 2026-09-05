import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

type AuthedUser = { id: string; role: string; subRole?: string | null };

@Injectable()
export class CollaborationService {
  constructor(private prisma: PrismaService) {}

  private canCollab(user: AuthedUser) {
    const isResearch = user.role === 'institution' && user.subRole === 'research';
    if (!isResearch && user.role !== 'admin') {
      throw new ForbiddenException('仅科研院所可使用科研协作');
    }
  }

  private isMember(collab: any, userId: string): boolean {
    const members = (collab.members as any[]) ?? [];
    return collab.ownerId === userId || members.some((m) => m?.userId === userId);
  }

  async create(user: AuthedUser, dto: any) {
    this.canCollab(user);
    if (!dto.name?.trim()) throw new BadRequestException('协作组名称不能为空');
    return this.prisma.collaboration.create({
      data: {
        ownerId: user.id,
        name: dto.name.trim(),
        description: dto.description ?? null,
        topic: dto.topic ?? null,
        members: Array.isArray(dto.members) ? dto.members : [],
      },
    });
  }

  async list(user: AuthedUser) {
    this.canCollab(user);
    const all = await this.prisma.collaboration.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { messages: true } } },
    });
    return all
      .filter((c) => this.isMember(c, user.id))
      .map((c) => ({
        id: c.id,
        ownerId: c.ownerId,
        name: c.name,
        description: c.description,
        topic: c.topic,
        members: c.members,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        messageCount: c._count.messages,
      }));
  }

  async findOne(user: AuthedUser, id: string) {
    this.canCollab(user);
    const collab = await this.prisma.collaboration.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { user: { select: { id: true, username: true } } },
        },
      },
    });
    if (!collab) throw new NotFoundException('协作组不存在');
    if (!this.isMember(collab, user.id) && user.role !== 'admin') {
      throw new ForbiddenException('非成员无权查看');
    }
    return {
      id: collab.id,
      ownerId: collab.ownerId,
      name: collab.name,
      description: collab.description,
      topic: collab.topic,
      members: collab.members,
      createdAt: collab.createdAt,
      updatedAt: collab.updatedAt,
      messages: collab.messages.map((m) => ({
        id: m.id,
        collaborationId: m.collaborationId,
        userId: m.userId,
        userName: m.user.username,
        type: m.type,
        content: m.content,
        fileUrl: m.fileUrl,
        createdAt: m.createdAt,
      })),
    };
  }

  async addMember(user: AuthedUser, id: string, dto: any) {
    this.canCollab(user);
    const collab = await this.prisma.collaboration.findUnique({ where: { id } });
    if (!collab) throw new NotFoundException('协作组不存在');
    if (collab.ownerId !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('仅组长可添加成员');
    }
    if (!dto.name?.trim()) throw new BadRequestException('成员姓名不能为空');
    const members = (collab.members as any[]) ?? [];
    members.push({
      userId: dto.userId ?? '',
      name: dto.name.trim(),
      role: dto.role ?? '研究员',
    });
    return this.prisma.collaboration.update({ where: { id }, data: { members } });
  }

  async postMessage(user: AuthedUser, id: string, dto: any) {
    this.canCollab(user);
    const collab = await this.prisma.collaboration.findUnique({ where: { id } });
    if (!collab) throw new NotFoundException('协作组不存在');
    if (!this.isMember(collab, user.id) && user.role !== 'admin') {
      throw new ForbiddenException('仅成员可发言');
    }
    if (!dto.content?.trim()) throw new BadRequestException('内容不能为空');
    return this.prisma.collabMessage.create({
      data: {
        collaborationId: id,
        userId: user.id,
        type: dto.type === 'file' ? 'file' : 'text',
        content: dto.content.trim(),
        fileUrl: dto.fileUrl ?? null,
      },
    });
  }

  async remove(user: AuthedUser, id: string) {
    this.canCollab(user);
    const collab = await this.prisma.collaboration.findUnique({ where: { id } });
    if (!collab) throw new NotFoundException('协作组不存在');
    if (collab.ownerId !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('仅组长可解散协作组');
    }
    await this.prisma.collaboration.delete({ where: { id } });
    return { success: true };
  }
}
