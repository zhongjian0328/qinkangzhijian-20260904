import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

const BUYER_ROLES = ['farmer', 'admin'];

type AuthedUser = { id: string; role: string };

@Injectable()
export class BulkPurchaseService {
  constructor(private prisma: PrismaService) {}

  private requireBuyer(user: AuthedUser) {
    if (!BUYER_ROLES.includes(user.role)) {
      throw new ForbiddenException('仅养殖户/企业可发布大宗采购询价');
    }
  }

  async create(user: AuthedUser, dto: any) {
    this.requireBuyer(user);
    if (!dto.title?.trim()) throw new BadRequestException('询价单标题不能为空');
    if (!Array.isArray(dto.items) || dto.items.length === 0) {
      throw new BadRequestException('询价商品不能为空');
    }
    return this.prisma.bulkPurchase.create({
      data: {
        userId: user.id,
        title: dto.title.trim(),
        items: dto.items,
        deadline: dto.deadline ? new Date(dto.deadline) : null,
      },
    });
  }

  async list(user: AuthedUser) {
    this.requireBuyer(user);
    const list = await this.prisma.bulkPurchase.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: { bids: true },
    });
    return list;
  }

  async detail(user: AuthedUser, id: string) {
    const bp = await this.prisma.bulkPurchase.findUnique({
      where: { id },
      include: {
        bids: {
          orderBy: { price: 'asc' },
          include: { merchant: { select: { id: true, username: true } } },
        },
      },
    });
    if (!bp) throw new NotFoundException('询价单不存在');
    const isCreator = bp.userId === user.id;
    const isAdmin = user.role === 'admin';
    const isMerchant = user.role === 'merchant';
    if (!isCreator && !isAdmin && !isMerchant) {
      throw new ForbiddenException('无权查看该询价单');
    }
    return bp;
  }

  async award(user: AuthedUser, id: string, bidId: string) {
    this.requireBuyer(user);
    const bp = await this.prisma.bulkPurchase.findUnique({ where: { id } });
    if (!bp) throw new NotFoundException('询价单不存在');
    if (bp.userId !== user.id && user.role !== 'admin') throw new ForbiddenException('无权定标该询价单');
    if (bp.status !== 'open') throw new BadRequestException('该询价单已定标');
    const bid = await this.prisma.bid.findUnique({ where: { id: bidId } });
    if (!bid || bid.bulkPurchaseId !== id) throw new NotFoundException('报价不存在');
    return this.prisma.bulkPurchase.update({
      where: { id },
      data: { status: 'awarded', winnerBidId: bidId },
    });
  }

  async cancel(user: AuthedUser, id: string) {
    this.requireBuyer(user);
    const bp = await this.prisma.bulkPurchase.findUnique({ where: { id } });
    if (!bp) throw new NotFoundException('询价单不存在');
    if (bp.userId !== user.id && user.role !== 'admin') throw new ForbiddenException('无权取消该询价单');
    if (!['open', 'awarded'].includes(bp.status)) throw new BadRequestException('该询价单不可取消');
    return this.prisma.bulkPurchase.update({
      where: { id },
      data: { status: 'cancelled' },
    });
  }
}
