import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

const TEACHER_MAIN_ROLES = ['admin'];
const TEACHER_SUB_ROLES = ['teacher'];
const STATUSES = ['draft', 'published', 'archived'];

type AuthedUser = { id: string; role: string; subRole?: string | null };

function isTeacher(user: AuthedUser): boolean {
  return TEACHER_MAIN_ROLES.includes(user.role) || TEACHER_SUB_ROLES.includes(user.subRole ?? '');
}

@Injectable()
export class ExamPaperService {
  constructor(private prisma: PrismaService) {}

  private requireTeacher(user: AuthedUser) {
    if (!isTeacher(user)) {
      throw new ForbiddenException('仅教师可管理试卷');
    }
  }

  async create(user: AuthedUser, dto: any) {
    this.requireTeacher(user);
    if (!dto.title?.trim()) throw new BadRequestException('试卷标题不能为空');
    const questionIds = Array.isArray(dto.questionIds) ? dto.questionIds : [];
    if (questionIds.length === 0) throw new BadRequestException('请选择题目');
    return this.prisma.examPaper.create({
      data: {
        teacherId: user.id,
        title: dto.title.trim(),
        chapter: dto.chapter ?? null,
        description: dto.description ?? null,
        questionIds,
        totalScore: dto.totalScore != null ? Number(dto.totalScore) : 100,
        questionCount: questionIds.length,
        duration: dto.duration != null ? Number(dto.duration) : null,
        status: STATUSES.includes(dto.status) ? dto.status : 'published',
      },
    });
  }

  async compose(user: AuthedUser, dto: any) {
    this.requireTeacher(user);
    if (!dto.title?.trim()) throw new BadRequestException('试卷标题不能为空');
    const count = Math.max(1, Math.min(50, Number(dto.count) || 10));
    const where: any = {};
    if (dto.chapter) where.chapter = dto.chapter;
    if (dto.difficulty && ['easy', 'medium', 'hard'].includes(dto.difficulty)) {
      where.difficulty = dto.difficulty;
    }
    const questions = await this.prisma.question.findMany({ where, take: count });
    if (questions.length === 0) throw new BadRequestException('题库中没有符合条件的题目');
    const questionIds = questions.map((q) => q.id);
    return this.prisma.examPaper.create({
      data: {
        teacherId: user.id,
        title: dto.title.trim(),
        chapter: dto.chapter ?? null,
        description: dto.description ?? null,
        questionIds,
        totalScore: dto.totalScore != null ? Number(dto.totalScore) : questions.length * 5,
        questionCount: questionIds.length,
        duration: dto.duration != null ? Number(dto.duration) : null,
        status: 'published',
      },
    });
  }

  async list(user: AuthedUser) {
    const teacher = isTeacher(user);
    const papers = await this.prisma.examPaper.findMany({
      where: teacher ? {} : { status: 'published' },
      orderBy: { createdAt: 'desc' },
      include: { teacher: { select: { username: true } } },
    });
    return papers.map((p) => ({
      id: p.id,
      teacherId: p.teacherId,
      title: p.title,
      chapter: p.chapter,
      description: p.description,
      totalScore: p.totalScore,
      questionCount: p.questionCount,
      duration: p.duration,
      status: p.status,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      teacherName: p.teacher?.username ?? null,
    }));
  }

  async findOne(user: AuthedUser, id: string) {
    const paper = await this.prisma.examPaper.findUnique({
      where: { id },
      include: { teacher: { select: { username: true } } },
    });
    if (!paper) throw new NotFoundException('试卷不存在');
    const teacher = isTeacher(user);
    const isOwner = paper.teacherId === user.id;
    if (paper.status !== 'published' && !teacher && !isOwner) {
      throw new ForbiddenException('该试卷尚未发布');
    }
    const questionIds = (paper.questionIds as string[]) ?? [];
    const questions = await this.prisma.question.findMany({
      where: { id: { in: questionIds } },
    });
    const orderMap = new Map(questionIds.map((qid, i) => [qid, i]));
    const ordered = questions.sort(
      (a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0),
    );
    return {
      id: paper.id,
      teacherId: paper.teacherId,
      title: paper.title,
      chapter: paper.chapter,
      description: paper.description,
      totalScore: paper.totalScore,
      questionCount: paper.questionCount,
      duration: paper.duration,
      status: paper.status,
      createdAt: paper.createdAt,
      teacherName: paper.teacher?.username ?? null,
      questions: ordered.map((q) => ({
        id: q.id,
        type: q.type,
        chapter: q.chapter,
        difficulty: q.difficulty,
        question: q.question,
        options: JSON.parse(q.options),
        answer: JSON.parse(q.answer),
        explanation: q.explanation,
      })),
    };
  }

  async update(user: AuthedUser, id: string, dto: any) {
    this.requireTeacher(user);
    const paper = await this.prisma.examPaper.findUnique({ where: { id } });
    if (!paper) throw new NotFoundException('试卷不存在');
    if (paper.teacherId !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('无权修改该试卷');
    }
    const data: any = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.chapter !== undefined) data.chapter = dto.chapter ?? null;
    if (dto.description !== undefined) data.description = dto.description ?? null;
    if (dto.questionIds !== undefined && Array.isArray(dto.questionIds)) {
      data.questionIds = dto.questionIds;
      data.questionCount = dto.questionIds.length;
    }
    if (dto.totalScore !== undefined) data.totalScore = Number(dto.totalScore);
    if (dto.duration !== undefined) data.duration = dto.duration != null ? Number(dto.duration) : null;
    if (dto.status !== undefined) data.status = STATUSES.includes(dto.status) ? dto.status : paper.status;
    return this.prisma.examPaper.update({ where: { id }, data });
  }

  async remove(user: AuthedUser, id: string) {
    this.requireTeacher(user);
    const paper = await this.prisma.examPaper.findUnique({ where: { id } });
    if (!paper) throw new NotFoundException('试卷不存在');
    if (paper.teacherId !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('无权删除该试卷');
    }
    await this.prisma.examPaper.delete({ where: { id } });
    return { success: true };
  }
}
