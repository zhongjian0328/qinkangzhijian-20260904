import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { EnvironmentCategory, EnvironmentResult } from '@qinkang/types';

export interface MetricSpec {
  key: string;
  label: string;
  unit: string;
  type: 'number' | 'boolean';
  warn?: number;
  crit?: number;
  direction?: 'high' | 'low';
  normalDesc: string;
}

export interface CategorySpec {
  label: string;
  description: string;
  metrics: MetricSpec[];
}

/** 四类环境检测指标定义 + 阈值（家禽养殖惯例参考值） */
export const ENV_CATEGORIES: Record<EnvironmentCategory, CategorySpec> = {
  air: {
    label: '空气检测',
    description: '舍内空气质量：氨气、二氧化碳、粉尘、硫化氢',
    metrics: [
      { key: 'ammonia', label: '氨气', unit: 'mg/m³', type: 'number', warn: 25, crit: 50, direction: 'high', normalDesc: '<25' },
      { key: 'co2', label: '二氧化碳', unit: 'ppm', type: 'number', warn: 3000, crit: 5000, direction: 'high', normalDesc: '<3000' },
      { key: 'dust', label: '粉尘', unit: 'mg/m³', type: 'number', warn: 10, crit: 20, direction: 'high', normalDesc: '<10' },
      { key: 'hydrogenSulfide', label: '硫化氢', unit: 'mg/m³', type: 'number', warn: 10, crit: 20, direction: 'high', normalDesc: '<10' },
    ],
  },
  water: {
    label: '水样检测',
    description: '饮水水质：pH、细菌总数、大肠杆菌、浊度',
    metrics: [
      { key: 'ph', label: 'pH 值', unit: '', type: 'number', direction: 'high', normalDesc: '6.5~8.5' },
      { key: 'bacteria', label: '细菌总数', unit: 'CFU/mL', type: 'number', warn: 1000, crit: 10000, direction: 'high', normalDesc: '<1000' },
      { key: 'coliform', label: '大肠杆菌群', unit: 'MPN/100mL', type: 'number', warn: 3, crit: 10, direction: 'high', normalDesc: '<3' },
      { key: 'turbidity', label: '浊度', unit: 'NTU', type: 'number', warn: 5, crit: 10, direction: 'high', normalDesc: '<5' },
    ],
  },
  feed: {
    label: '饲料检测',
    description: '饲料质量：水分、霉变、黄曲霉毒素、粗蛋白',
    metrics: [
      { key: 'moisture', label: '水分', unit: '%', type: 'number', warn: 14, crit: 16, direction: 'high', normalDesc: '<14' },
      { key: 'mold', label: '霉变', unit: '', type: 'boolean', normalDesc: '无霉变' },
      { key: 'aflatoxin', label: '黄曲霉毒素', unit: 'ppb', type: 'number', warn: 20, crit: 50, direction: 'high', normalDesc: '<20' },
      { key: 'protein', label: '粗蛋白', unit: '%', type: 'number', warn: 15, direction: 'low', normalDesc: '≥15（按配方）' },
    ],
  },
  surface: {
    label: '环境表面检测',
    description: '舍内表面微生物：菌落总数、沙门氏菌、粉尘',
    metrics: [
      { key: 'bacteria', label: '菌落总数', unit: 'CFU/cm²', type: 'number', warn: 1000, crit: 10000, direction: 'high', normalDesc: '<1000' },
      { key: 'salmonella', label: '沙门氏菌', unit: '', type: 'boolean', normalDesc: '未检出' },
      { key: 'dust', label: '粉尘', unit: 'mg/m³', type: 'number', warn: 10, crit: 20, direction: 'high', normalDesc: '<10' },
    ],
  },
};

@Injectable()
export class EnvironmentService {
  constructor(private prisma: PrismaService) {}

  getCategories() {
    return ENV_CATEGORIES;
  }

  async list(userId: string, houseId?: string, category?: string) {
    const where: any = { userId };
    if (houseId) {
      await this.assertHouseOwnership(userId, houseId);
      where.houseId = houseId;
    }
    if (category) {
      if (!['air', 'water', 'feed', 'surface'].includes(category)) {
        throw new BadRequestException('检测类型不合法');
      }
      where.category = category;
    }
    return this.prisma.environmentTest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async findById(userId: string, id: string) {
    const test = await this.prisma.environmentTest.findUnique({ where: { id } });
    if (!test) throw new NotFoundException('检测记录不存在');
    if (test.userId !== userId) throw new ForbiddenException('无权查看该记录');
    return test;
  }

  async create(userId: string, dto: any) {
    const category = dto.category;
    const spec = ENV_CATEGORIES[category as EnvironmentCategory];
    if (!spec) throw new BadRequestException('检测类型不合法');

    if (dto.houseId) {
      await this.assertHouseOwnership(userId, dto.houseId);
    }

    const metrics = this.validateMetrics(spec, dto.metrics ?? {});
    const { result, flagged } = this.evaluate(spec, metrics);

    const test = await this.prisma.environmentTest.create({
      data: {
        userId,
        houseId: dto.houseId ?? null,
        category,
        metrics,
        result,
        note: dto.note ?? null,
      },
    });

    return { test, flagged };
  }

  async remove(userId: string, id: string) {
    const test = await this.prisma.environmentTest.findUnique({ where: { id } });
    if (!test) throw new NotFoundException('检测记录不存在');
    if (test.userId !== userId) throw new ForbiddenException('无权删除该记录');
    await this.prisma.environmentTest.delete({ where: { id } });
    return { success: true };
  }

  /** 校验指标值并规整为数值/布尔 */
  private validateMetrics(spec: CategorySpec, input: any): Record<string, number | boolean> {
    const out: Record<string, number | boolean> = {};
    for (const m of spec.metrics) {
      const raw = input[m.key];
      if (raw == null || raw === '') continue;
      if (m.type === 'boolean') {
        out[m.key] = raw === true || raw === 'true' || raw === 1 || raw === '1';
      } else {
        const n = Number(raw);
        if (Number.isNaN(n)) throw new BadRequestException(`${m.label}数值不合法`);
        out[m.key] = n;
      }
    }
    return out;
  }

  /** 依据阈值评估检测结果 */
  private evaluate(spec: CategorySpec, metrics: Record<string, number | boolean>) {
    const flagged: { key: string; label: string; severity: EnvironmentResult; message: string }[] = [];
    let worst: EnvironmentResult = 'normal';

    for (const m of spec.metrics) {
      const value = metrics[m.key];
      if (value == null) continue;

      let severity: EnvironmentResult = 'normal';
      let message = '';

      if (m.type === 'boolean') {
        if (value === true) {
          severity = 'abnormal';
          message = `${m.label}检出异常`;
        }
      } else {
        const n = value as number;
        // pH 特殊：区间判定
        if (m.key === 'ph') {
          if (n < 6.0 || n > 9.0) {
            severity = 'abnormal';
            message = `${m.label} ${n} 严重偏离适宜区间（6.5~8.5）`;
          } else if (n < 6.5 || n > 8.5) {
            severity = 'warning';
            message = `${m.label} ${n} 超出适宜区间（6.5~8.5）`;
          }
        } else if (m.direction === 'high') {
          if (n > (m.crit ?? Infinity)) {
            severity = 'abnormal';
            message = `${m.label} ${n}${m.unit} 已达危险水平（阈值 ${m.crit}）`;
          } else if (n > (m.warn ?? Infinity)) {
            severity = 'warning';
            message = `${m.label} ${n}${m.unit} 偏高（阈值 ${m.warn}）`;
          }
        } else if (m.direction === 'low') {
          if (n < (m.warn ?? -Infinity)) {
            severity = 'warning';
            message = `${m.label} ${n}${m.unit} 偏低（阈值 ${m.warn}）`;
          }
        }
      }

      if (severity !== 'normal') {
        flagged.push({ key: m.key, label: m.label, severity, message });
        if (severity === 'abnormal' || (severity === 'warning' && worst === 'normal')) {
          worst = severity;
        }
      }
    }

    return { result: worst, flagged };
  }

  private async assertHouseOwnership(userId: string, houseId: string) {
    const house = await this.prisma.poultryHouse.findUnique({ where: { id: houseId } });
    if (!house) throw new NotFoundException('禽舍不存在');
    if (house.userId !== userId) throw new ForbiddenException('无权关联该禽舍');
    return house;
  }
}
