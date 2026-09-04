import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PoultryHouseService } from './poultry-house.service';

@ApiTags('poultry-house')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('poultry-house')
export class PoultryHouseController {
  constructor(private poultryHouseService: PoultryHouseService) {}

  @Post()
  @ApiOperation({ summary: '创建禽舍' })
  create(@Request() req, @Body() dto: any) {
    return this.poultryHouseService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: '获取用户所有禽舍' })
  findAll(@Request() req) {
    return this.poultryHouseService.findByUser(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取禽舍详情' })
  findOne(@Param('id') id: string) {
    return this.poultryHouseService.findById(id);
  }

  @Get(':id/environment')
  @ApiOperation({ summary: '获取环境数据' })
  getEnvironment(@Param('id') id: string) {
    return this.poultryHouseService.getEnvironmentData(id);
  }

  @Get(':id/alerts')
  @ApiOperation({ summary: '获取告警列表' })
  getAlerts(@Param('id') id: string) {
    return this.poultryHouseService.getAlerts(id);
  }
}
