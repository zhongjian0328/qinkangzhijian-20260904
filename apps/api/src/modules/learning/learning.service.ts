import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

// 初始题库（首次启动种子，覆盖常见禽病/营养/中毒/管理类考点）
const MOCK_QUESTIONS: {
  type: 'single' | 'multiple' | 'judge';
  chapter: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  options: string[];
  answer: number[];
  explanation: string;
}[] = [
  { type: 'single', chapter: 'ch04', difficulty: 'medium', question: '禽流感病毒属于哪一科？', options: ['正黏病毒科', '副黏病毒科', '冠状病毒科', '疱疹病毒科'], answer: [0], explanation: '禽流感病毒属于正黏病毒科 A 型流感病毒属。' },
  { type: 'single', chapter: 'ch05', difficulty: 'easy', question: '新城疫的特征性病变是？', options: ['腺胃乳头出血', '花斑肾', '肝针尖坏死点', '心包积液'], answer: [0], explanation: '新城疫特征性病变为腺胃乳头出血和肠道枣核状溃疡。' },
  { type: 'multiple', chapter: 'ch06', difficulty: 'hard', question: '传染性支气管炎的分型包括？', options: ['呼吸型', '肾型', '生殖型', '神经型'], answer: [0, 1, 2], explanation: '传支分为呼吸型、肾型和生殖型，无神经型。' },
  { type: 'judge', chapter: 'ch08', difficulty: 'easy', question: '马立克氏病的法氏囊通常肿大。', options: ['正确', '错误'], answer: [1], explanation: '马立克氏病法氏囊萎缩，禽白血病法氏囊肿大。' },
  { type: 'single', chapter: 'ch10', difficulty: 'medium', question: '传染性法氏囊病的易感日龄是？', options: ['1-2周龄', '3-6周龄', '10-12周龄', '产蛋期'], answer: [1], explanation: '3-6 周龄雏鸡最易感。' },
  { type: 'single', chapter: 'ch24', difficulty: 'medium', question: '禽霍乱的病原是？', options: ['大肠杆菌', '多杀性巴氏杆菌', '沙门氏菌', '链球菌'], answer: [1], explanation: '禽霍乱由多杀性巴氏杆菌引起。' },
  { type: 'single', chapter: 'ch35', difficulty: 'easy', question: '盲肠球虫病的典型症状是？', options: ['血便', '绿便', '白便', '水便'], answer: [0], explanation: '盲肠球虫病典型症状为排血便。' },
  { type: 'multiple', chapter: 'ch04', difficulty: 'medium', question: '高致病性禽流感的症状包括？', options: ['头肿', '冠髯发黑', '脚鳞出血', '产蛋正常'], answer: [0, 1, 2], explanation: '高致病禽流感表现头肿、冠髯发黑、脚鳞出血，产蛋下降。' },
  { type: 'judge', chapter: 'ch31', difficulty: 'easy', question: '慢性呼吸道病由鸡毒支原体引起。', options: ['正确', '错误'], answer: [0], explanation: 'CRD 由鸡毒支原体(MG)感染引起。' },
  { type: 'single', chapter: 'ch40', difficulty: 'medium', question: '痛风的特征性病变是？', options: ['内脏尿酸盐沉积', '肝坏死', '肺出血', '脑软化'], answer: [0], explanation: '痛风特征为内脏和关节尿酸盐沉积。' },
  { type: 'single', chapter: 'ch02', difficulty: 'easy', question: '鸡新城疫的病原是？', options: ['新城疫病毒', '禽流感病毒', '传染性支气管炎病毒', '马立克氏病病毒'], answer: [0], explanation: '新城疫由新城疫病毒(NDV)引起。' },
  { type: 'single', chapter: 'ch12', difficulty: 'medium', question: '禽大肠杆菌病的常见病变是？', options: ['肝周炎', '心包炎', '气囊炎', '以上都是'], answer: [3], explanation: '大肠杆菌病常表现肝周炎、心包炎、气囊炎等浆膜炎。' },
  { type: 'judge', chapter: 'ch15', difficulty: 'easy', question: '鸡白痢主要由沙门氏菌引起。', options: ['正确', '错误'], answer: [0], explanation: '鸡白痢由鸡白痢沙门氏菌引起。' },
  { type: 'single', chapter: 'ch18', difficulty: 'medium', question: '传染性喉气管炎的典型症状是？', options: ['咳血', '血便', '扭颈', '脱毛'], answer: [0], explanation: '传染性喉气管炎典型症状为咳血、伸颈张口呼吸。' },
  { type: 'single', chapter: 'ch20', difficulty: 'easy', question: '鸡痘的传播媒介主要是？', options: ['蚊虫', '苍蝇', '跳蚤', '螨虫'], answer: [0], explanation: '鸡痘主要由蚊虫叮咬传播。' },
  { type: 'multiple', chapter: 'ch22', difficulty: 'medium', question: '鸡球虫病的防控措施包括？', options: ['保持垫料干燥', '定期投药', '疫苗接种', '提高饲养密度'], answer: [0, 1, 2], explanation: '球虫病防控应保持干燥、定期投药、可免疫，不宜提高密度。' },
  { type: 'judge', chapter: 'ch26', difficulty: 'medium', question: '禽伤寒的病原是沙门氏菌。', options: ['正确', '错误'], answer: [0], explanation: '禽伤寒由禽伤寒沙门氏菌引起。' },
  { type: 'single', chapter: 'ch30', difficulty: 'medium', question: '鸡慢性呼吸道病的病原是？', options: ['鸡毒支原体', '滑液囊支原体', '大肠杆菌', '新城疫病毒'], answer: [0], explanation: '慢性呼吸道病(CRD)由鸡毒支原体引起。' },
  { type: 'single', chapter: 'ch33', difficulty: 'hard', question: '鸡传染性贫血病的特征性病变是？', options: ['骨髓变黄', '脾脏肿大', '胸腺萎缩', '以上都是'], answer: [3], explanation: '传染性贫血表现骨髓变黄、胸腺萎缩、脾脏肿大等。' },
  { type: 'judge', chapter: 'ch37', difficulty: 'easy', question: '鸡蛔虫病主要通过消化道感染。', options: ['正确', '错误'], answer: [0], explanation: '蛔虫病经消化道食入感染性虫卵传播。' },
  { type: 'single', chapter: 'ch42', difficulty: 'medium', question: '鸡脑脊髓炎的特征性症状是？', options: ['头颈部震颤', '扭颈', '角弓反张', '瘫痪'], answer: [0], explanation: '禽脑脊髓炎特征为头颈震颤、共济失调。' },
  { type: 'single', chapter: 'ch44', difficulty: 'easy', question: '有机磷中毒的典型症状是？', options: ['流涎、瞳孔缩小、肌肉震颤', '发热', '贫血', '水肿'], answer: [0], explanation: '有机磷中毒表现流涎、瞳孔缩小、肌肉震颤等副交感兴奋症状。' },
  { type: 'judge', chapter: 'ch46', difficulty: 'easy', question: '黄曲霉毒素中毒主要损害肝脏。', options: ['正确', '错误'], answer: [0], explanation: '黄曲霉毒素主要损害肝脏，引起肝肿大、坏死。' },
  { type: 'single', chapter: 'ch48', difficulty: 'medium', question: '维生素B1缺乏可导致？', options: ['神经症状', '贫血', '出血', '佝偻病'], answer: [0], explanation: 'VB1 缺乏引起多发性神经炎，表现仰头、角弓反张等。' },
  { type: 'single', chapter: 'ch52', difficulty: 'medium', question: '雏鸡脱水的主要表现是？', options: ['体重减轻、趾爪干瘪', '呼吸困难', '排血便', '扭颈'], answer: [0], explanation: '雏鸡脱水表现体重减轻、趾爪干瘪、皮肤皱缩。' },
  { type: 'judge', chapter: 'ch55', difficulty: 'easy', question: '产蛋鸡疲劳综合征多发生于高产蛋鸡。', options: ['正确', '错误'], answer: [0], explanation: '产蛋鸡疲劳综合征多见于高产蛋鸡笼养后期。' },
  { type: 'single', chapter: 'ch58', difficulty: 'medium', question: '鸡腹水综合征多见于？', options: ['快速生长的肉鸡', '蛋鸡', '雏鸡', '种鸡'], answer: [0], explanation: '腹水综合征多见于快速生长的肉鸡。' },
  { type: 'multiple', chapter: 'ch60', difficulty: 'medium', question: '鸡应激综合征的诱因包括？', options: ['高温', '密度过大', '运输', '充足饮水'], answer: [0, 1, 2], explanation: '高温、密度过大、运输等均可诱发应激，充足饮水可缓解。' },
  { type: 'judge', chapter: 'ch62', difficulty: 'easy', question: '鸡嗉囊炎与采食腐败变质饲料有关。', options: ['正确', '错误'], answer: [0], explanation: '嗉囊炎多与采食腐败变质、难以消化的饲料有关。' },
  { type: 'single', chapter: 'ch03', difficulty: 'easy', question: '预防禽流感的关键措施是？', options: ['免疫+生物安全', '滥用抗生素', '提高温度', '增加密度'], answer: [0], explanation: '禽流感防控以免疫接种和生物安全为核心。' },
];

const MENTOR_MAIN_ROLES = ['admin'];
const MENTOR_SUB_ROLES = ['teacher'];

type AuthedUser = { id: string; role: string; subRole?: string | null };

function isMentor(user: AuthedUser): boolean {
  return MENTOR_MAIN_ROLES.includes(user.role) || MENTOR_SUB_ROLES.includes(user.subRole ?? '');
}

function parseQuestion<T>(q: T & { options: string; answer: string }) {
  return {
    ...q,
    options: JSON.parse(q.options) as string[],
    answer: JSON.parse(q.answer) as number[],
  };
}

function parseInternLog<T>(log: T & { images: string | null }) {
  return {
    ...log,
    images: log.images ? (JSON.parse(log.images) as string[]) : [],
  };
}

@Injectable()
export class LearningService implements OnModuleInit {
  private readonly logger = new Logger(LearningService.name);

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    try {
      const count = await this.prisma.question.count();
      if (count === 0) {
        await this.prisma.question.createMany({
          data: MOCK_QUESTIONS.map((q) => ({
            ...q,
            options: JSON.stringify(q.options),
            answer: JSON.stringify(q.answer),
          })),
        });
        this.logger.log(`已种子化 ${MOCK_QUESTIONS.length} 道题库题目`);
      }
    } catch (e) {
      this.logger.warn(`题库种子化失败：${(e as Error).message}`);
    }
  }

  // ===== 题库与测验 =====
  async getQuestions(chapter?: string, type?: string, difficulty?: string, limit = 20) {
    const where: any = {};
    if (chapter) where.chapter = chapter;
    if (type) where.type = type;
    if (difficulty) where.difficulty = difficulty;
    const questions = await this.prisma.question.findMany({ where, take: limit });
    return questions.map(parseQuestion);
  }

  async submitExam(userId: string, dto: { chapter?: string | null; answers: { questionId: string; selected: number[] }[] }) {
    if (!dto.answers?.length) throw new BadRequestException('答案不能为空');

    const questionIds = dto.answers.map((a) => a.questionId);
    const questions = await this.prisma.question.findMany({ where: { id: { in: questionIds } } });
    if (questions.length !== questionIds.length) {
      throw new BadRequestException('部分题目不存在');
    }

    const questionMap = new Map(questions.map((q) => [q.id, q]));
    let correctCount = 0;
    const detail = dto.answers.map((a) => {
      const q = questionMap.get(a.questionId)!;
      const answer = JSON.parse(q.answer) as number[];
      const selected = [...(a.selected ?? [])].sort();
      const correct = JSON.stringify(answer.sort()) === JSON.stringify(selected);
      if (correct) correctCount += 1;
      return { questionId: a.questionId, selected: a.selected, correct, answer };
    });

    const totalScore = dto.answers.length * 10;
    const score = correctCount * 10;

    const record = await this.prisma.examRecord.create({
      data: {
        userId,
        type: dto.chapter ? 'practice' : 'mock',
        chapter: dto.chapter ?? null,
        totalScore,
        score,
        answers: JSON.stringify(detail),
      },
    });

    return { record, correctCount, total: dto.answers.length, score, totalScore };
  }

  async getExamRecords(userId: string) {
    const records = await this.prisma.examRecord.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r) => ({
      ...r,
      answers: JSON.parse(r.answers),
    }));
  }

  // ===== 实习日志 =====
  async getInternLogs(user: AuthedUser) {
    // 导师/管理员可查看全部（按状态），学生查看自己的
    const where = isMentor(user) ? {} : { userId: user.id };
    const logs = await this.prisma.internLog.findMany({
      where,
      orderBy: { logDate: 'desc' },
      include: { user: { select: { username: true } } },
    });
    return logs.map((l) => ({
      ...parseInternLog(l),
      studentName: l.user?.username ?? null,
    }));
  }

  async createInternLog(userId: string, dto: { title: string; content: string; logDate: string; images?: string[]; studentDiagnosis?: string }) {
    if (!dto.title?.trim()) throw new BadRequestException('日志标题不能为空');
    if (!dto.content?.trim()) throw new BadRequestException('日志内容不能为空');
    const log = await this.prisma.internLog.create({
      data: {
        userId,
        title: dto.title.trim(),
        content: dto.content,
        images: dto.images?.length ? JSON.stringify(dto.images) : null,
        studentDiagnosis: dto.studentDiagnosis ?? null,
        logDate: new Date(dto.logDate),
      },
    });
    return parseInternLog(log);
  }

  async getInternLogDetail(id: string, user: AuthedUser) {
    const log = await this.prisma.internLog.findUnique({
      where: { id },
      include: { user: { select: { username: true } } },
    });
    if (!log) throw new NotFoundException('实习日志不存在');
    if (log.userId !== user.id && !isMentor(user)) throw new ForbiddenException('无权查看该日志');
    return { ...parseInternLog(log), studentName: log.user?.username ?? null };
  }

  async reviewInternLog(id: string, user: AuthedUser, comment: string) {
    if (!isMentor(user)) throw new ForbiddenException('仅导师可批注实习日志');
    if (!comment?.trim()) throw new BadRequestException('批注内容不能为空');
    const log = await this.prisma.internLog.findUnique({ where: { id } });
    if (!log) throw new NotFoundException('实习日志不存在');
    const updated = await this.prisma.internLog.update({
      where: { id },
      data: { mentorComment: comment.trim(), mentorId: user.id, status: 'reviewed' },
    });

    await this.prisma.notification.create({
      data: {
        userId: log.userId,
        type: 'teaching',
        title: '导师已批注实习日志',
        content: `您的实习日志《${log.title}》已获导师批注，请查看批注意见。`,
        data: { internLogId: log.id },
      },
    });

    return parseInternLog(updated);
  }
}
