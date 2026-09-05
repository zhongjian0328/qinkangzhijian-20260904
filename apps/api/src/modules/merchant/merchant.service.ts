import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

const MERCHANT_ROLES = ['merchant', 'admin'];
const BULK_STATUSES = ['open', 'awarded', 'completed', 'cancelled'];

type AuthedUser = { id: string; role: string };

@Injectable()
export class MerchantService {
  constructor(private prisma: PrismaService) {}

  private requireMerchant(user: AuthedUser) {
    if (!MERCHANT_ROLES.includes(user.role)) {
      throw new ForbiddenException('仅兽药/设备商可操作');
    }
  }

  // ===== 商家工作台看板 =====
  async dashboard(user: AuthedUser) {
    this.requireMerchant(user);
    const [products, orders, completedOrders, pendingShip, openBulks] = await Promise.all([
      this.prisma.product.count({ where: { merchantId: user.id } }),
      this.prisma.order.count({ where: { merchantId: user.id } }),
      this.prisma.order.findMany({ where: { merchantId: user.id, status: 'completed' } }),
      this.prisma.order.count({ where: { merchantId: user.id, status: { in: ['pending', 'paid'] } } }),
      this.prisma.bulkPurchase.count({ where: { status: 'open' } }),
    ]);
    const revenue = completedOrders.reduce((s, o) => s + o.totalAmount, 0);
    return {
      productCount: products,
      orderCount: orders,
      revenue: Number(revenue.toFixed(2)),
      pendingShipCount: pendingShip,
      openBulkCount: openBulks,
    };
  }

  // ===== 商品管理 =====
  async getProducts(user: AuthedUser) {
    this.requireMerchant(user);
    return this.prisma.product.findMany({
      where: { merchantId: user.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createProduct(user: AuthedUser, dto: any) {
    this.requireMerchant(user);
    if (!dto.name?.trim() || !dto.category?.trim()) {
      throw new BadRequestException('商品名称和分类不能为空');
    }
    return this.prisma.product.create({
      data: {
        merchantId: user.id,
        name: dto.name.trim(),
        category: dto.category.trim(),
        price: Number(dto.price ?? 0),
        promoPrice: dto.promoPrice != null ? Number(dto.promoPrice) : null,
        stock: Number(dto.stock ?? 0),
        unit: dto.unit ?? '件',
        description: dto.description ?? null,
        manufacturer: dto.manufacturer ?? null,
      },
    });
  }

  async updateProduct(user: AuthedUser, id: string, dto: any) {
    this.requireMerchant(user);
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('商品不存在');
    if (product.merchantId !== user.id) throw new ForbiddenException('无权操作该商品');

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.price !== undefined) data.price = Number(dto.price);
    if (dto.promoPrice !== undefined) data.promoPrice = dto.promoPrice != null ? Number(dto.promoPrice) : null;
    if (dto.stock !== undefined) data.stock = Number(dto.stock);
    if (dto.unit !== undefined) data.unit = dto.unit;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.manufacturer !== undefined) data.manufacturer = dto.manufacturer;
    return this.prisma.product.update({ where: { id }, data });
  }

  async deleteProduct(user: AuthedUser, id: string) {
    this.requireMerchant(user);
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('商品不存在');
    if (product.merchantId !== user.id) throw new ForbiddenException('无权删除该商品');
    await this.prisma.product.delete({ where: { id } });
    return { success: true };
  }

  // ===== 订单履约 =====
  async getOrders(user: AuthedUser) {
    this.requireMerchant(user);
    return this.prisma.order.findMany({
      where: { merchantId: user.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async shipOrder(user: AuthedUser, id: string, dto: any) {
    this.requireMerchant(user);
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('订单不存在');
    if (order.merchantId !== user.id) throw new ForbiddenException('无权处理该订单');
    if (!['pending', 'paid'].includes(order.status)) throw new BadRequestException('该订单状态不可发货');

    const company = dto.logisticsCompany ?? '平台物流';
    const trackingNo = dto.trackingNo ?? '';
    const logistics: any[] = (order.logistics as any[]) ?? [];
    logistics.push({
      status: '已发货',
      desc: `${company}，运单号 ${trackingNo}`,
      time: new Date().toISOString(),
    });
    return this.prisma.order.update({
      where: { id },
      data: { status: 'shipped', logistics },
    });
  }

  async refundOrder(user: AuthedUser, id: string, dto: any) {
    this.requireMerchant(user);
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('订单不存在');
    if (order.merchantId !== user.id) throw new ForbiddenException('无权处理该订单');
    if (['completed', 'cancelled'].includes(order.status)) throw new BadRequestException('该订单不可退款');

    const logistics: any[] = (order.logistics as any[]) ?? [];
    logistics.push({
      status: '已退款',
      desc: dto.reason ?? '商家已退款',
      time: new Date().toISOString(),
    });
    return this.prisma.order.update({
      where: { id },
      data: { status: 'cancelled', logistics },
    });
  }

  // ===== 大宗采购（供应商侧：询价大厅 + 报价） =====
  async getBulkPurchases(user: AuthedUser) {
    this.requireMerchant(user);
    const list = await this.prisma.bulkPurchase.findMany({
      where: { status: 'open' },
      orderBy: { createdAt: 'desc' },
    });
    return list;
  }

  async createBid(user: AuthedUser, bulkPurchaseId: string, dto: any) {
    this.requireMerchant(user);
    if (dto.price == null || Number(dto.price) <= 0) throw new BadRequestException('报价金额必须大于 0');
    const bp = await this.prisma.bulkPurchase.findUnique({ where: { id: bulkPurchaseId } });
    if (!bp) throw new NotFoundException('询价单不存在');
    if (bp.status !== 'open') throw new BadRequestException('该询价单已结束报价');
    return this.prisma.bid.create({
      data: {
        bulkPurchaseId,
        merchantId: user.id,
        price: Number(dto.price),
        paymentTerms: dto.paymentTerms ?? null,
        deliveryTime: dto.deliveryTime ?? null,
        notes: dto.notes ?? null,
      },
    });
  }
}
