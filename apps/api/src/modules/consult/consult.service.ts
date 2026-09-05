import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

interface RawConsultReply {
  reply: string;
  preliminary_diagnosis?: string | null;
  confidence?: number | null;
  suggestions?: string[] | null;
  next_steps?: string | null;
  related_diseases?: string[] | null;
}

@Injectable()
export class ConsultService {
  private readonly logger = new Logger(ConsultService.name);

  constructor(private prisma: PrismaService) {}

  private aiUrl() {
    return process.env.AI_SERVICE_URL ?? 'http://localhost:5000';
  }

  async sendMessage(
    userId: string,
    dto: {
      sessionId?: string;
      content: string;
      imageUrls?: string[];
      role?: string;
      subRole?: string;
    },
  ) {
    const content = (dto.content ?? '').trim();
    if (!content && !dto.imageUrls?.length) {
      throw new BadRequestException('消息内容不能为空');
    }

    let session = dto.sessionId
      ? await this.prisma.consultSession.findUnique({ where: { id: dto.sessionId } })
      : null;
    if (dto.sessionId && !session) {
      throw new BadRequestException('会话不存在');
    }
    if (session && session.userId !== userId) {
      throw new BadRequestException('无权访问该会话');
    }

    const history: any[] = (session?.messages as any[]) ?? [];
    const userMessage = {
      role: 'user',
      content,
      imageUrls: dto.imageUrls ?? [],
      createdAt: new Date().toISOString(),
    };
    const fullHistory = [...history, userMessage];

    const reply = await this.callAI(fullHistory, dto.imageUrls ?? [], dto.role, dto.subRole);

    const assistantMessage = {
      role: 'assistant',
      content: reply.reply ?? '',
      diagnosis: reply.preliminary_diagnosis
        ? {
            preliminaryDiagnosis: reply.preliminary_diagnosis,
            confidence: reply.confidence ?? 0,
            suggestions: reply.suggestions ?? [],
            nextSteps: reply.next_steps ?? '',
          }
        : null,
      relatedDiseases: reply.related_diseases ?? [],
      createdAt: new Date().toISOString(),
    };

    const messages = [...history, userMessage, assistantMessage];
    const title = session?.title ?? (content ? content.slice(0, 20) : 'AI 问诊');

    if (session) {
      session = await this.prisma.consultSession.update({
        where: { id: session.id },
        data: { messages, updatedAt: new Date() },
      });
    } else {
      session = await this.prisma.consultSession.create({
        data: { userId, title, messages },
      });
    }

    return {
      sessionId: session.id,
      reply: reply.reply,
      diagnosis: assistantMessage.diagnosis,
      relatedDiseases: reply.related_diseases ?? [],
      messages,
    };
  }

  private async callAI(
    history: any[],
    imageUrls: string[],
    role?: string,
    subRole?: string,
  ): Promise<RawConsultReply> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90000);
    try {
      const response = await fetch(`${this.aiUrl()}/consult`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.content })),
          image_urls: imageUrls ?? [],
          role: role ?? 'farmer',
          sub_role: subRole ?? '',
        }),
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new BadRequestException(`AI问诊返回 ${response.status}: ${await response.text()}`);
      }
      return response.json();
    } catch (e) {
      if ((e as any)?.name === 'AbortError') {
        throw new BadRequestException('AI问诊响应超时，请稍后重试');
      }
      throw e;
    } finally {
      clearTimeout(timeout);
    }
  }

  async listSessions(userId: string) {
    return this.prisma.consultSession.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });
  }

  async generateReport(userId: string, id: string) {
    const session = await this.prisma.consultSession.findUnique({ where: { id } });
    if (!session) throw new BadRequestException('会话不存在');
    if (session.userId !== userId) throw new BadRequestException('无权访问该会话');

    const messages = (session.messages as any[]) ?? [];
    const diagMsg = [...messages]
      .reverse()
      .find((m) => m.role === 'assistant' && m.diagnosis?.preliminaryDiagnosis);
    if (!diagMsg) {
      throw new BadRequestException('当前会话暂无诊断结论，无法生成报告');
    }

    const userContents = messages
      .filter((m) => m.role === 'user' && m.content)
      .map((m) => m.content.trim())
      .filter(Boolean);

    const report = {
      title: session.title,
      generatedAt: new Date().toISOString(),
      diagnosis: diagMsg.diagnosis ?? null,
      relatedDiseases: diagMsg.relatedDiseases ?? [],
      conversationSummary: userContents.length
        ? userContents.slice(-5).join('；')
        : session.title,
      disclaimer: '本报告由AI生成，仅供参考，不能替代执业兽医诊断。',
    };

    await this.prisma.consultSession.update({
      where: { id },
      data: { report, updatedAt: new Date() },
    });

    return report;
  }

  async getSession(userId: string, id: string) {
    const session = await this.prisma.consultSession.findUnique({ where: { id } });
    if (!session) throw new BadRequestException('会话不存在');
    if (session.userId !== userId) throw new BadRequestException('无权访问该会话');
    return session;
  }

  async deleteSession(userId: string, id: string) {
    const session = await this.prisma.consultSession.findUnique({ where: { id } });
    if (!session) throw new BadRequestException('会话不存在');
    if (session.userId !== userId) throw new BadRequestException('无权访问该会话');
    await this.prisma.consultSession.delete({ where: { id } });
    return { success: true };
  }
}
