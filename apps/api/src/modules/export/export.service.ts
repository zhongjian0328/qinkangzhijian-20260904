import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

type AuthedUser = { id: string; role: string; subRole?: string | null };

const BOM = '﻿';

function toCsv(headers: string[], rows: (string | number | null)[][]): string {
  const escape = (v: string | number | null) => {
    const s = v == null ? '' : String(v);
    if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  const lines = [headers.map(escape).join(',')];
  for (const row of rows) lines.push(row.map(escape).join(','));
  return BOM + lines.join('\r\n');
}

function fmtDate(v: Date | null | undefined): string {
  if (!v) return '';
  const d = new Date(v);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

@Injectable()
export class ExportService {
  constructor(private prisma: PrismaService) {}

  async exportEntity(user: AuthedUser, entity: string): Promise<{ filename: string; csv: string }> {
    switch (entity) {
      case 'diagnoses':
        return this.exportDiagnoses(user);
      case 'immunizations':
        return this.exportImmunizations(user);
      case 'epidemic-records':
        return this.exportEpidemicRecords(user);
      case 'orders':
        return this.exportOrders(user);
      case 'daily-records':
        return this.exportDailyRecords(user);
      default:
        throw new BadRequestException(
          '不支持的导出类型：diagnoses / immunizations / epidemic-records / orders / daily-records',
        );
    }
  }

  private async exportDiagnoses(user: AuthedUser) {
    const items = await this.prisma.diagnosis.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    const rows = items.map((d) => [
      fmtDate(d.createdAt),
      d.species,
      (d.symptoms ?? []).join('、'),
      d.aiResult ? (d.aiResult as any).disease ?? '' : '',
      d.confidence != null ? Math.round(d.confidence * 100) + '%' : '',
      d.status,
    ]);
    return {
      filename: 'diagnoses.csv',
      csv: toCsv(['时间', '禽种', '症状', 'AI诊断', '置信度', '状态'], rows),
    };
  }

  private async exportImmunizations(user: AuthedUser) {
    const items = await this.prisma.immunization.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    const rows = items.map((i) => [
      i.vaccineName,
      i.disease ?? '',
      i.method,
      i.dosage ?? '',
      i.immunizedCount,
      fmtDate(i.administeredAt),
      fmtDate(i.nextDueAt),
      i.status,
      i.operator ?? '',
    ]);
    return {
      filename: 'immunizations.csv',
      csv: toCsv(['疫苗名称', '预防疾病', '免疫方式', '剂量', '数量', '免疫日期', '下次免疫', '状态', '操作人'], rows),
    };
  }

  private async exportEpidemicRecords(user: AuthedUser) {
    const isCdc = user.role === 'institution';
    const items = await this.prisma.epidemicRecord.findMany({
      where: isCdc ? {} : { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    const rows = items.map((e) => [
      fmtDate(e.reportedAt),
      [e.province, e.city, e.district].filter(Boolean).join(' '),
      e.disease,
      e.affectedCount,
      e.deathCount,
      e.level,
      e.symptoms ?? '',
    ]);
    return {
      filename: 'epidemic-records.csv',
      csv: toCsv(['上报时间', '区域', '疾病', '发病数', '死亡数', '级别', '症状'], rows),
    };
  }

  private async exportOrders(user: AuthedUser) {
    const isMerchant = user.role === 'merchant';
    const items = await this.prisma.order.findMany({
      where: isMerchant ? { merchantId: user.id } : { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    const rows = items.map((o) => [
      fmtDate(o.createdAt),
      o.totalAmount,
      o.status,
      o.address ?? '',
      o.phone ?? '',
    ]);
    return {
      filename: 'orders.csv',
      csv: toCsv(['下单时间', '金额', '状态', '地址', '电话'], rows),
    };
  }

  private async exportDailyRecords(user: AuthedUser) {
    const batches = await this.prisma.batch.findMany({
      where: { userId: user.id },
      select: { id: true },
    });
    const ids = batches.map((b) => b.id);
    const items = await this.prisma.dailyRecord.findMany({
      where: { batchId: { in: ids } },
      orderBy: { recordDate: 'desc' },
    });
    const rows = items.map((r) => [
      fmtDate(r.recordDate),
      r.deathCount,
      r.cullCount,
      r.feedAmount,
      r.eggCount,
    ]);
    return {
      filename: 'daily-records.csv',
      csv: toCsv(['日期', '死亡数', '淘汰数', '采食量', '产蛋数'], rows),
    };
  }
}
