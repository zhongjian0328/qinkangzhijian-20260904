import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { BulkPurchaseService } from './bulk-purchase.service';

@ApiTags('bulk-purchase')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('bulk-purchase')
export class BulkPurchaseController {
  constructor(private bulkPurchaseService: BulkPurchaseService) {}

  @Post()
  @ApiOperation({ summary: '发布大宗采购询价单（养殖户/企业）' })
  create(@Request() req, @Body() dto: any) {
    return this.bulkPurchaseService.create(req.user, dto);
  }

  @Get()
  @ApiOperation({ summary: '我的询价单' })
  list(@Request() req) {
    return this.bulkPurchaseService.list(req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: '询价单详情（含报价）' })
  detail(@Request() req, @Param('id') id: string) {
    return this.bulkPurchaseService.detail(req.user, id);
  }

  @Post(':id/award')
  @ApiOperation({ summary: '比价定标' })
  award(@Request() req, @Param('id') id: string, @Body() dto: { bidId: string }) {
    return this.bulkPurchaseService.award(req.user, id, dto.bidId);
  }

  @Put(':id/cancel')
  @ApiOperation({ summary: '取消询价单' })
  cancel(@Request() req, @Param('id') id: string) {
    return this.bulkPurchaseService.cancel(req.user, id);
  }
}
