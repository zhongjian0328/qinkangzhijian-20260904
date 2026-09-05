import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CommerceService } from './commerce.service';

@ApiTags('commerce')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('commerce')
export class CommerceController {
  constructor(private commerceService: CommerceService) {}

  // 商品
  @Get('products')
  @ApiOperation({ summary: '商品列表（支持分类/关键词筛选）' })
  getProducts(@Query('category') category?: string, @Query('keyword') keyword?: string) {
    return this.commerceService.getProducts(category, keyword);
  }

  @Get('products/:id')
  @ApiOperation({ summary: '商品详情' })
  getProduct(@Param('id') id: string) {
    return this.commerceService.getProduct(id);
  }

  // 订单
  @Post('orders')
  @ApiOperation({ summary: '创建订单' })
  createOrder(@Request() req, @Body() dto: any) {
    return this.commerceService.createOrder(req.user, dto);
  }

  @Get('orders')
  @ApiOperation({ summary: '我的订单列表' })
  getOrders(@Request() req) {
    return this.commerceService.getOrders(req.user);
  }

  @Get('orders/:id')
  @ApiOperation({ summary: '订单详情' })
  getOrder(@Request() req, @Param('id') id: string) {
    return this.commerceService.getOrder(req.user, id);
  }

  @Put('orders/:id')
  @ApiOperation({ summary: '更新订单状态' })
  updateOrderStatus(@Request() req, @Param('id') id: string, @Body() dto: { status: string }) {
    return this.commerceService.updateOrderStatus(req.user, id, dto.status);
  }

  // 诊疗服务单
  @Post('service-orders')
  @ApiOperation({ summary: '发起诊疗服务' })
  createServiceOrder(@Request() req, @Body() dto: any) {
    return this.commerceService.createServiceOrder(req.user, dto);
  }

  @Get('service-orders')
  @ApiOperation({ summary: '我的服务单（兽医含已接单）' })
  getServiceOrders(@Request() req) {
    return this.commerceService.getServiceOrders(req.user);
  }

  @Get('service-orders/pool')
  @ApiOperation({ summary: '接单大厅（兽医待接单）' })
  getServiceOrderPool(@Request() req) {
    return this.commerceService.getServiceOrderPool(req.user);
  }

  @Put('service-orders/:id')
  @ApiOperation({ summary: '接单/流转/取消/定价' })
  updateServiceOrder(@Request() req, @Param('id') id: string, @Body() dto: any) {
    return this.commerceService.updateServiceOrder(req.user, id, dto);
  }

  // 在线咨询
  @Post('consultations')
  @ApiOperation({ summary: '发起咨询' })
  createConsultation(@Request() req, @Body() dto: any) {
    return this.commerceService.createConsultation(req.user, dto);
  }

  @Get('consultations')
  @ApiOperation({ summary: '我的咨询列表' })
  getConsultations(@Request() req) {
    return this.commerceService.getConsultations(req.user);
  }

  @Get('consultations/pool')
  @ApiOperation({ summary: '咨询大厅（兽医待接单）' })
  getConsultationPool(@Request() req) {
    return this.commerceService.getConsultationPool(req.user);
  }

  @Get('consultations/:id')
  @ApiOperation({ summary: '咨询详情（含消息）' })
  getConsultation(@Request() req, @Param('id') id: string) {
    return this.commerceService.getConsultation(req.user, id);
  }

  @Post('consultations/:id/messages')
  @ApiOperation({ summary: '发送咨询消息' })
  addMessage(@Request() req, @Param('id') id: string, @Body() dto: { content: string }) {
    return this.commerceService.addConsultationMessage(req.user, id, dto);
  }
}
