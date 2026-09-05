import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

const TEACHER_MAIN_ROLES = ['admin'];
const TEACHER_SUB_ROLES = ['teacher'];
const COURSE_STATUSES = ['draft', 'published'];

type AuthedUser = { id: string; role: string; subRole?: string | null };

function isTeacher(user: AuthedUser): boolean {
  return TEACHER_MAIN_ROLES.includes(user.role) || TEACHER_SUB_ROLES.includes(user.subRole ?? '');
}

@Injectable()
export class CourseService {
  constructor(private prisma: PrismaService) {}

  private requireTeacher(user: AuthedUser) {
    if (!isTeacher(user)) {
      throw new ForbiddenException('仅教师可管理课程');
    }
  }

  async create(user: AuthedUser, dto: any) {
    this.requireTeacher(user);
    if (!dto.title?.trim()) throw new BadRequestException('课程标题不能为空');
    return this.prisma.course.create({
      data: {
        teacherId: user.id,
        title: dto.title.trim(),
        subject: dto.subject ?? null,
        description: dto.description ?? null,
        chapters: Array.isArray(dto.chapters) ? dto.chapters : [],
        status: COURSE_STATUSES.includes(dto.status) ? dto.status : 'published',
      },
    });
  }

  async list(user: AuthedUser) {
    const teacher = isTeacher(user);
    const courses = await this.prisma.course.findMany({
      where: teacher ? {} : { status: 'published' },
      orderBy: { createdAt: 'desc' },
      include: { teacher: { select: { username: true } } },
    });
    return courses.map((c) => ({
      id: c.id,
      teacherId: c.teacherId,
      title: c.title,
      subject: c.subject,
      description: c.description,
      chapters: c.chapters,
      status: c.status,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      teacherName: c.teacher?.username ?? null,
      chapterCount: Array.isArray(c.chapters) ? c.chapters.length : 0,
    }));
  }

  async findOne(user: AuthedUser, id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        teacher: { select: { username: true } },
        progresses: { where: { userId: user.id } },
      },
    });
    if (!course) throw new NotFoundException('课程不存在');
    const teacher = isTeacher(user);
    const isOwner = course.teacherId === user.id;
    if (course.status !== 'published' && !teacher && !isOwner) {
      throw new ForbiddenException('该课程尚未发布');
    }
    return {
      id: course.id,
      teacherId: course.teacherId,
      title: course.title,
      subject: course.subject,
      description: course.description,
      chapters: course.chapters,
      status: course.status,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      teacherName: course.teacher?.username ?? null,
      chapterCount: Array.isArray(course.chapters) ? course.chapters.length : 0,
      myProgress: course.progresses[0] ?? null,
    };
  }

  async update(user: AuthedUser, id: string, dto: any) {
    this.requireTeacher(user);
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) throw new NotFoundException('课程不存在');
    if (course.teacherId !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('无权修改该课程');
    }
    const data: any = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.subject !== undefined) data.subject = dto.subject ?? null;
    if (dto.description !== undefined) data.description = dto.description ?? null;
    if (dto.chapters !== undefined) data.chapters = Array.isArray(dto.chapters) ? dto.chapters : course.chapters;
    if (dto.status !== undefined) {
      data.status = COURSE_STATUSES.includes(dto.status) ? dto.status : course.status;
    }
    return this.prisma.course.update({ where: { id }, data });
  }

  async remove(user: AuthedUser, id: string) {
    this.requireTeacher(user);
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) throw new NotFoundException('课程不存在');
    if (course.teacherId !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('无权删除该课程');
    }
    await this.prisma.course.delete({ where: { id } });
    return { success: true };
  }

  async updateProgress(user: AuthedUser, id: string, dto: any) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) throw new NotFoundException('课程不存在');
    const progress = dto.progress != null ? Math.max(0, Math.min(100, Number(dto.progress))) : 0;
    const completedChapters = Array.isArray(dto.completedChapters)
      ? dto.completedChapters.map((n: any) => Number(n))
      : [];
    return this.prisma.courseProgress.upsert({
      where: { courseId_userId: { courseId: id, userId: user.id } },
      update: { progress, completedChapters },
      create: { courseId: id, userId: user.id, progress, completedChapters },
    });
  }

  async myProgress(user: AuthedUser) {
    const progresses = await this.prisma.courseProgress.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      include: { course: { select: { id: true, title: true, subject: true, status: true } } },
    });
    return progresses.map((p) => ({
      id: p.id,
      courseId: p.courseId,
      userId: p.userId,
      progress: p.progress,
      completedChapters: p.completedChapters,
      updatedAt: p.updatedAt,
      courseTitle: p.course.title,
      courseSubject: p.course.subject,
    }));
  }
}
