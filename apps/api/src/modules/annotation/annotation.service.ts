import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

const STATUSES = ['pending', 'verified', 'special'];

type AuthedUser = { id: string; role: string; subRole?: string | null };

@Injectable()
export class AnnotationService {
  constructor(private prisma: PrismaService) {}

  private canAnnotate(user: AuthedUser) {
    const isResearch = user.role === 'institution' && user.subRole === 'research';
    if (!isResearch && user.role !== 'admin') {
      throw new ForbiddenException('仅科研院所可进行数据标注');
    }
  }

  async create(user: AuthedUser, dto: any) {
    this.canAnnotate(user);
    if (!dto.title?.trim()) throw new BadRequestException('病例标题不能为空');
    if (!dto.disease?.trim()) throw new BadRequestException('疾病分类不能为空');
    return this.prisma.annotation.create({
      data: {
        userId: user.id,
        title: dto.title.trim(),
        imageUrl: dto.imageUrl ?? null,
        symptoms: Array.isArray(dto.symptoms) ? dto.symptoms : [],
        labels: Array.isArray(dto.labels) ? dto.labels : [],
        disease: dto.disease.trim(),
        note: dto.note ?? null,
        status: STATUSES.includes(dto.status) ? dto.status : 'pending',
      },
    });
  }

  async list(user: AuthedUser) {
    this.canAnnotate(user);
    return this.prisma.annotation.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async pool(user: AuthedUser) {
    this.canAnnotate(user);
    return this.prisma.annotation.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
  }

  async stats(user: AuthedUser) {
    this.canAnnotate(user);
    const [total, pending, verified, special] = await Promise.all([
      this.prisma.annotation.count(),
      this.prisma.annotation.count({ where: { status: 'pending' } }),
      this.prisma.annotation.count({ where: { status: 'verified' } }),
      this.prisma.annotation.count({ where: { status: 'special' } }),
    ]);
    return { total, pending, verified, special };
  }

  async findOne(user: AuthedUser, id: string) {
    this.canAnnotate(user);
    const annotation = await this.prisma.annotation.findUnique({ where: { id } });
    if (!annotation) throw new NotFoundException('标注记录不存在');
    return annotation;
  }

  async update(user: AuthedUser, id: string, dto: any) {
    this.canAnnotate(user);
    const annotation = await this.prisma.annotation.findUnique({ where: { id } });
    if (!annotation) throw new NotFoundException('标注记录不存在');
    if (annotation.userId !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('无权修改该标注');
    }
    const data: any = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.imageUrl !== undefined) data.imageUrl = dto.imageUrl;
    if (dto.symptoms !== undefined) data.symptoms = Array.isArray(dto.symptoms) ? dto.symptoms : [];
    if (dto.labels !== undefined) data.labels = Array.isArray(dto.labels) ? dto.labels : [];
    if (dto.disease !== undefined) data.disease = dto.disease;
    if (dto.note !== undefined) data.note = dto.note;
    if (dto.status !== undefined) {
      data.status = STATUSES.includes(dto.status) ? dto.status : annotation.status;
    }
    return this.prisma.annotation.update({ where: { id }, data });
  }

  async remove(user: AuthedUser, id: string) {
    this.canAnnotate(user);
    const annotation = await this.prisma.annotation.findUnique({ where: { id } });
    if (!annotation) throw new NotFoundException('标注记录不存在');
    if (annotation.userId !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('无权删除该标注');
    }
    await this.prisma.annotation.delete({ where: { id } });
    return { success: true };
  }
}
