import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

// 环境告警阈值（家禽养殖惯例参考值）
const THRESHOLDS = {
  // 温度：舒适 10~35℃；低于 5 或高于 42 为危急
  temperature: { warnLow: 10, warnHigh: 35, critLow: 5, critHigh: 42 },
  // 湿度：舒适 40~80%；低于 20 或高于 95 为危急
  humidity: { warnLow: 30, warnHigh: 85, critLow: 20, critHigh: 95 },
  // 氨气：>25 预警，>50 危急（mg/m³）
  ammonia: { warn: 25, crit: 50 },
  // 二氧化碳：>3000 预警，>5000 危急（ppm）
  co2: { warn: 3000, crit: 5000 },
};

type EnvironmentInput = {
  temperature: number;
  humidity: number;
  ammonia?: number | null;
  co2?: number | null;
  ventilation: string;
};

@Injectable()
export class PoultryHouseService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: any) {
    return this.prisma.poultryHouse.create({
      data: { ...dto, userId },
    });
  }

  async findByUser(userId: string) {
    return this.prisma.poultryHouse.findMany({
      where: { userId },
      include: {
        alerts: {
          where: { acknowledged: false },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });
  }

  async findById(userId: string, id: string) {
    return this.assertOwnership(userId, id);
  }

  async update(userId: string, id: string, dto: any) {
    await this.assertOwnership(userId, id);

    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.capacity !== undefined) data.capacity = dto.capacity;
    if (dto.currentCount !== undefined) data.currentCount = dto.currentCount;
    if (dto.species !== undefined) data.species = dto.species;
    if (dto.age !== undefined) data.age = dto.age;

    return this.prisma.poultryHouse.update({
      where: { id },
      data,
    });
  }

  async remove(userId: string, id: string) {
    await this.assertOwnership(userId, id);
    // 先删子记录，避免外键约束阻断（schema 未开级联删除）
    await this.prisma.$transaction([
      this.prisma.alert.deleteMany({ where: { houseId: id } }),
      this.prisma.environmentData.deleteMany({ where: { houseId: id } }),
      this.prisma.poultryHouse.delete({ where: { id } }),
    ]);
    return { success: true };
  }

  async getEnvironmentData(userId: string, houseId: string) {
    await this.assertOwnership(userId, houseId);
    return this.prisma.environmentData.findMany({
      where: { houseId },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });
  }

  async getAlerts(userId: string, houseId: string) {
    await this.assertOwnership(userId, houseId);
    return this.prisma.alert.findMany({
      where: { houseId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  /** 录入一条环境数据，并对超阈值项生成告警 */
  async addEnvironmentData(userId: string, houseId: string, dto: EnvironmentInput) {
    await this.assertOwnership(userId, houseId);

    const temp = Number(dto.temperature);
    const humidity = Number(dto.humidity);
    if (Number.isNaN(temp) || temp < -30 || temp > 60) {
      throw new BadRequestException('温度数值不合法');
    }
    if (Number.isNaN(humidity) || humidity < 0 || humidity > 100) {
      throw new BadRequestException('湿度数值不合法');
    }
    const ventilation = dto.ventilation;
    if (!['good', 'moderate', 'poor'].includes(ventilation)) {
      throw new BadRequestException('通风状态不合法');
    }
    const ammonia = dto.ammonia != null ? Number(dto.ammonia) : null;
    const co2 = dto.co2 != null ? Number(dto.co2) : null;

    const record = await this.prisma.environmentData.create({
      data: {
        houseId,
        temperature: temp,
        humidity,
        ammonia,
        co2,
        ventilation: ventilation as any,
      },
    });

    const alerts = this.buildAlerts(houseId, { temperature: temp, humidity, ammonia, co2 });
    if (alerts.length) {
      await this.prisma.alert.createMany({ data: alerts });
    }

    return { record, alerts };
  }

  async acknowledgeAlert(userId: string, alertId: string) {
    const alert = await this.prisma.alert.findUnique({ where: { id: alertId } });
    if (!alert) throw new NotFoundException('告警不存在');
    const house = await this.prisma.poultryHouse.findUnique({
      where: { id: alert.houseId },
    });
    if (!house || house.userId !== userId) {
      throw new ForbiddenException('无权操作该告警');
    }
    return this.prisma.alert.update({
      where: { id: alertId },
      data: { acknowledged: true },
    });
  }

  /** 依据阈值判断生成告警，返回待写入的 Alert 数据 */
  private buildAlerts(
    houseId: string,
    env: { temperature: number; humidity: number; ammonia: number | null; co2: number | null },
  ) {
    const alerts: {
      houseId: string;
      type: any;
      severity: any;
      message: string;
    }[] = [];

    const { temperature, humidity, ammonia, co2 } = env;
    const t = THRESHOLDS.temperature;
    if (temperature < t.critLow || temperature > t.critHigh) {
      alerts.push({
        houseId,
        type: 'temperature',
        severity: 'critical',
        message: `舍内温度 ${temperature}℃ 严重偏离舒适区间（${t.warnLow}~${t.warnHigh}℃）`,
      });
    } else if (temperature < t.warnLow || temperature > t.warnHigh) {
      alerts.push({
        houseId,
        type: 'temperature',
        severity: 'warning',
        message: `舍内温度 ${temperature}℃ 超出舒适区间（${t.warnLow}~${t.warnHigh}℃）`,
      });
    }

    const h = THRESHOLDS.humidity;
    if (humidity < h.critLow || humidity > h.critHigh) {
      alerts.push({
        houseId,
        type: 'humidity',
        severity: 'critical',
        message: `舍内湿度 ${humidity}% 严重偏离适宜区间（${h.warnLow}~${h.warnHigh}%）`,
      });
    } else if (humidity < h.warnLow || humidity > h.warnHigh) {
      alerts.push({
        houseId,
        type: 'humidity',
        severity: 'warning',
        message: `舍内湿度 ${humidity}% 超出适宜区间（${h.warnLow}~${h.warnHigh}%）`,
      });
    }

    if (ammonia != null) {
      const a = THRESHOLDS.ammonia;
      if (ammonia > a.crit) {
        alerts.push({
          houseId,
          type: 'ammonia',
          severity: 'critical',
          message: `氨气浓度 ${ammonia}mg/m³ 已达危险水平（阈值 ${a.crit}）`,
        });
      } else if (ammonia > a.warn) {
        alerts.push({
          houseId,
          type: 'ammonia',
          severity: 'warning',
          message: `氨气浓度 ${ammonia}mg/m³ 偏高（阈值 ${a.warn}）`,
        });
      }
    }

    if (co2 != null) {
      const c = THRESHOLDS.co2;
      if (co2 > c.crit) {
        alerts.push({
          houseId,
          type: 'co2',
          severity: 'critical',
          message: `二氧化碳浓度 ${co2}ppm 已达危险水平（阈值 ${c.crit}）`,
        });
      } else if (co2 > c.warn) {
        alerts.push({
          houseId,
          type: 'co2',
          severity: 'warning',
          message: `二氧化碳浓度 ${co2}ppm 偏高（阈值 ${c.warn}）`,
        });
      }
    }

    return alerts;
  }

  /** 校验禽舍存在且属于当前用户，否则抛异常 */
  private async assertOwnership(userId: string, id: string) {
    const house = await this.prisma.poultryHouse.findUnique({ where: { id } });
    if (!house) throw new NotFoundException('禽舍不存在');
    if (house.userId !== userId) throw new ForbiddenException('无权操作该禽舍');
    return house;
  }
}