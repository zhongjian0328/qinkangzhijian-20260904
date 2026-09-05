import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

const VET_ROLES = ['vet', 'technician', 'admin'];

const ORDER_STATUSES = ['pending', 'paid', 'shipped', 'completed', 'cancelled'];
const SERVICE_ORDER_STATUSES = ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'];

// 初始商品目录（首次启动种子，兽药/疫苗/饲料/添加剂）
const MOCK_PRODUCTS = [
  { name: '阿莫西林可溶性粉', category: '抗生素', price: 28.5, stock: 500, unit: '袋', manufacturer: '某兽药厂', description: '广谱抗生素，用于敏感菌感染' },
  { name: '恩诺沙星溶液', category: '抗生素', price: 35.0, stock: 300, unit: '瓶', manufacturer: '某兽药厂', description: '氟喹诺酮类抗菌药' },
  { name: '氟苯尼考粉', category: '抗生素', price: 45.0, stock: 150, unit: '袋', manufacturer: '某兽药厂', description: '氯霉素类广谱抗菌' },
  { name: '双黄连口服液', category: '中药', price: 42.0, stock: 200, unit: '瓶', manufacturer: '某中药厂', description: '清热解毒，抗病毒' },
  { name: '新城疫IV系疫苗', category: '疫苗', price: 15.0, stock: 1000, unit: '瓶', manufacturer: '某生物制品厂', description: '新城疫弱毒活疫苗' },
  { name: '禽流感H5灭活苗', category: '疫苗', price: 25.0, stock: 800, unit: '瓶', manufacturer: '某生物制品厂', description: '禽流感灭活疫苗' },
  { name: '地克珠利溶液', category: '抗寄生虫', price: 38.0, stock: 250, unit: '瓶', manufacturer: '某兽药厂', description: '球虫病防治' },
  { name: '电解多维', category: '营养补充', price: 20.0, stock: 600, unit: '袋', manufacturer: '某添加剂厂', description: '补充维生素电解质' },
];

type AuthedUser = { id: string; role: string };

@Injectable()
export class CommerceService implements OnModuleInit {
  private readonly logger = new Logger(CommerceService.name);

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    try {
      const count = await this.prisma.product.count();
      if (count === 0) {
        await this.prisma.product.createMany({ data: MOCK_PRODUCTS });
        this.logger.log(`已种子化 ${MOCK_PRODUCTS.length} 件商品`);
      }
    } catch (e) {
      this.logger.warn(`商品种子化失败：${(e as Error).message}`);
    }
  }

  private isVet(user: AuthedUser): boolean {
    return VET_ROLES.includes(user.role);
  }

  // ===== 商品 =====
  async getProducts(category?: string, keyword?: string) {
    const where: any = {};
    if (category) where.category = category;
    if (keyword) where.name = { contains: keyword, mode: 'insensitive' };
    return this.prisma.product.findMany({ where, orderBy: [{ category: 'asc' }, { createdAt: 'desc' }] });
  }

  async getProduct(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('商品不存在');
    return product;
  }

  // ===== 订单 =====
  async createOrder(user: AuthedUser, dto: any) {
    const items = dto.items;
    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestException('订单商品不能为空');
    }
    const totalAmount = items.reduce((s: number, i: any) => s + Number(i.price) * Number(i.quantity), 0);
    return this.prisma.order.create({
      data: {
        userId: user.id,
        items,
        totalAmount,
        address: dto.address ?? null,
        phone: dto.phone ?? null,
      },
    });
  }

  async getOrders(user: AuthedUser) {
    return this.prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrder(user: AuthedUser, id: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('订单不存在');
    if (order.userId !== user.id && !this.isVet(user)) throw new ForbiddenException('无权查看该订单');
    return order;
  }

  async updateOrderStatus(user: AuthedUser, id: string, status: string) {
    if (!ORDER_STATUSES.includes(status)) throw new BadRequestException('无效的订单状态');
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('订单不存在');
    // 普通用户只能取消自己的订单；兽医/管理员可流转其它状态
    if (!this.isVet(user)) {
      if (order.userId !== user.id) throw new ForbiddenException('无权操作该订单');
      if (status !== 'cancelled') throw new ForbiddenException('普通用户仅可取消订单');
    }
    return this.prisma.order.update({ where: { id }, data: { status: status as any } });
  }

  // ===== 诊疗服务单 =====
  async createServiceOrder(user: AuthedUser, dto: any) {
    if (!['on_site', 'online', 'lab_test'].includes(dto.serviceType)) {
      throw new BadRequestException('无效的服务类型');
    }
    return this.prisma.serviceOrder.create({
      data: {
        userId: user.id,
        serviceType: dto.serviceType,
        description: dto.description ?? null,
        address: dto.address ?? null,
        appointmentAt: dto.appointmentAt ? new Date(dto.appointmentAt) : null,
      },
    });
  }

  async getServiceOrders(user: AuthedUser) {
    const where = this.isVet(user)
      ? { OR: [{ userId: user.id }, { vetId: user.id }] }
      : { userId: user.id };
    return this.prisma.serviceOrder.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async getServiceOrderPool(user: AuthedUser) {
    if (!this.isVet(user)) throw new ForbiddenException('仅兽医/技术员可查看接单大厅');
    return this.prisma.serviceOrder.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateServiceOrder(user: AuthedUser, id: string, dto: any) {
    const order = await this.prisma.serviceOrder.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('服务单不存在');

    if (dto.action === 'accept') {
      if (!this.isVet(user)) throw new ForbiddenException('仅兽医/技术员可接单');
      if (order.status !== 'pending') throw new BadRequestException('该服务单已被接单');
      return this.prisma.serviceOrder.update({
        where: { id },
        data: { vetId: user.id, status: 'accepted' },
      });
    }

    if (dto.action === 'cancel') {
      if (order.userId !== user.id && !this.isVet(user)) throw new ForbiddenException('无权取消该服务单');
      if (['completed', 'cancelled'].includes(order.status)) throw new BadRequestException('该服务单不可取消');
      return this.prisma.serviceOrder.update({
        where: { id },
        data: { status: 'cancelled' },
      });
    }

    // 状态流转（in_progress / completed）+ 定价
    const isOwner = order.userId === user.id;
    const isAssignedVet = order.vetId === user.id;
    if (!isOwner && !isAssignedVet && !this.isVet(user)) {
      throw new ForbiddenException('无权更新该服务单');
    }
    const data: any = {};
    if (dto.status) {
      if (!SERVICE_ORDER_STATUSES.includes(dto.status)) throw new BadRequestException('无效的服务单状态');
      data.status = dto.status;
    }
    if (dto.price !== undefined) {
      if (!this.isVet(user)) throw new ForbiddenException('仅兽医可设置服务价格');
      data.price = Number(dto.price);
    }
    return this.prisma.serviceOrder.update({ where: { id }, data });
  }

  // ===== 在线咨询 =====
  async createConsultation(user: AuthedUser, dto: any) {
    if (!dto.subject) throw new BadRequestException('咨询主题不能为空');
    const initial = dto.initialMessage?.trim();
    const messages = initial
      ? [{ role: 'user', content: initial, timestamp: new Date().toISOString() }]
      : [];
    return this.prisma.consultation.create({
      data: { userId: user.id, subject: dto.subject, messages },
    });
  }

  async getConsultations(user: AuthedUser) {
    const where = this.isVet(user)
      ? { OR: [{ userId: user.id }, { vetId: user.id }] }
      : { userId: user.id };
    const list = await this.prisma.consultation.findMany({ where, orderBy: { createdAt: 'desc' } });
    return list.map((c) => this.withParsedMessages(c));
  }

  async getConsultationPool(user: AuthedUser) {
    if (!this.isVet(user)) throw new ForbiddenException('仅兽医/技术员可查看咨询大厅');
    const list = await this.prisma.consultation.findMany({
      where: { vetId: null },
      orderBy: { createdAt: 'asc' },
    });
    return list.map((c) => this.withParsedMessages(c));
  }

  async getConsultation(user: AuthedUser, id: string) {
    const consult = await this.prisma.consultation.findUnique({ where: { id } });
    if (!consult) throw new NotFoundException('咨询不存在');
    if (consult.userId !== user.id && consult.vetId !== user.id && !this.isVet(user)) {
      throw new ForbiddenException('无权查看该咨询');
    }
    return this.withParsedMessages(consult);
  }

  async addConsultationMessage(user: AuthedUser, id: string, dto: { content: string }) {
    if (!dto.content?.trim()) throw new BadRequestException('消息内容不能为空');
    const consult = await this.prisma.consultation.findUnique({ where: { id } });
    if (!consult) throw new NotFoundException('咨询不存在');

    let role: 'user' | 'vet';
    let vetId = consult.vetId;
    if (this.isVet(user) && consult.userId !== user.id) {
      role = 'vet';
      if (!vetId) vetId = user.id; // 兽医首次回复即接单
    } else if (consult.userId === user.id) {
      role = 'user';
    } else {
      throw new ForbiddenException('无权在该咨询中发言');
    }

    const messages = (consult.messages as any[]) ?? [];
    messages.push({ role, content: dto.content.trim(), timestamp: new Date().toISOString() });

    const updated = await this.prisma.consultation.update({
      where: { id },
      data: { messages, vetId },
    });
    return this.withParsedMessages(updated);
  }

  private withParsedMessages<T extends { messages: unknown }>(c: T) {
    return { ...c, messages: (c.messages as any[]) ?? [] };
  }
}
