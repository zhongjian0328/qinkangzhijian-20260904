import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CustomerService } from './customer.service';

@ApiTags('customer')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('customer')
export class CustomerController {
  constructor(private customerService: CustomerService) {}

  @Post()
  @ApiOperation({ summary: '新增客户（仅兽医/技术员）' })
  create(@Request() req, @Body() dto: any) {
    return this.customerService.create(req.user, dto);
  }

  @Get('stats')
  @ApiOperation({ summary: '客户分层与跟进统计' })
  stats(@Request() req) {
    return this.customerService.stats(req.user);
  }

  @Get()
  @ApiOperation({ summary: '我的客户列表' })
  list(@Request() req) {
    return this.customerService.list(req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: '客户详情' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.customerService.findOne(req.user, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新客户档案' })
  update(@Request() req, @Param('id') id: string, @Body() dto: any) {
    return this.customerService.update(req.user, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除客户' })
  remove(@Request() req, @Param('id') id: string) {
    return this.customerService.remove(req.user, id);
  }
}
