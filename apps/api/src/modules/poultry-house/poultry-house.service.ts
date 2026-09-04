import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

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
          take: 5,
        },
      },
    });
  }

  async findById(id: string) {
    const house = await this.prisma.poultryHouse.findUnique({ where: { id } });
    if (!house) throw new Error('禽舍不存在');
    return house;
  }

  async getEnvironmentData(houseId: string) {
    return this.prisma.environmentData.findMany({
      where: { houseId },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });
  }

  async getAlerts(houseId: string) {
    return this.prisma.alert.findMany({
      where: { houseId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }
}
