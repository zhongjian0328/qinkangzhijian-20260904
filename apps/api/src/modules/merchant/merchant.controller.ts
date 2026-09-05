import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { MerchantService } from './merchant.service';

@ApiTags('merchant')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('merchant')
export class MerchantController {
  constructor(private merchantService: MerchantService) {}

  @Get('dashboard')
  @ApiOperation({ summary: '商家工作台看板（兽药/设备商）' })
  dashboard(@Request() req) {
    return this.merchantService.dashboard(req.user);
  }

  // 商品管理
  @Get('products')
  @ApiOperation({ summary: '我的商品列表' })
  getProducts(@Request() req) {
    return this.merchantService.getProducts(req.user);
  }

  @Post('products')
  @ApiOperation({ summary: '上架商品' })
  createProduct(@Request() req, @Body() dto: any) {
    return this.merchantService.createProduct(req.user, dto);
  }

  @Put('products/:id')
  @ApiOperation({ summary: '编辑商品（改价/库存/促销）' })
  updateProduct(@Request() req, @Param('id') id: string, @Body() dto: any) {
    return this.merchantService.updateProduct(req.user, id, dto);
  }

  @Delete('products/:id')
  @ApiOperation({ summary: '删除商品' })
  deleteProduct(@Request() req, @Param('id') id: string) {
    return this.merchantService.deleteProduct(req.user, id);
  }

  // 订单履约
  @Get('orders')
  @ApiOperation({ summary: '商家订单列表' })
  getOrders(@Request() req) {
    return this.merchantService.getOrders(req.user);
  }

  @Put('orders/:id/ship')
  @ApiOperation({ summary: '发货（含物流）' })
  shipOrder(@Request() req, @Param('id') id: string, @Body() dto: any) {
    return this.merchantService.shipOrder(req.user, id, dto);
  }

  @Put('orders/:id/refund')
  @ApiOperation({ summary: '退款/售后' })
  refundOrder(@Request() req, @Param('id') id: string, @Body() dto: any) {
    return this.merchantService.refundOrder(req.user, id, dto);
  }

  // 大宗采购（供应商侧）
  @Get('bulk-purchases')
  @ApiOperation({ summary: '询价大厅（供应商）' })
  getBulkPurchases(@Request() req) {
    return this.merchantService.getBulkPurchases(req.user);
  }

  @Post('bulk-purchases/:id/bids')
  @ApiOperation({ summary: '供应商报价' })
  createBid(@Request() req, @Param('id') id: string, @Body() dto: any) {
    return this.merchantService.createBid(req.user, id, dto);
  }
}
