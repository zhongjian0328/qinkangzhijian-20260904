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
  findOne(@Request() req, @Param('id') id: string) {
    return this.poultryHouseService.findById(req.user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新禽舍信息' })
  update(@Request() req, @Param('id') id: string, @Body() dto: any) {
    return this.poultryHouseService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除禽舍' })
  remove(@Request() req, @Param('id') id: string) {
    return this.poultryHouseService.remove(req.user.id, id);
  }

  @Get(':id/environment')
  @ApiOperation({ summary: '获取环境数据' })
  getEnvironment(@Request() req, @Param('id') id: string) {
    return this.poultryHouseService.getEnvironmentData(req.user.id, id);
  }

  @Post(':id/environment')
  @ApiOperation({ summary: '录入环境数据' })
  addEnvironment(@Request() req, @Param('id') id: string, @Body() dto: any) {
    return this.poultryHouseService.addEnvironmentData(req.user.id, id, dto);
  }

  @Get(':id/alerts')
  @ApiOperation({ summary: '获取告警列表' })
  getAlerts(@Request() req, @Param('id') id: string) {
    return this.poultryHouseService.getAlerts(req.user.id, id);
  }

  @Post('alerts/:alertId/acknowledge')
  @ApiOperation({ summary: '确认告警' })
  acknowledge(@Request() req, @Param('alertId') alertId: string) {
    return this.poultryHouseService.acknowledgeAlert(req.user.id, alertId);
  }
}