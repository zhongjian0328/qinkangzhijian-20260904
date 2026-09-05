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
import { EpidemicAlertService } from './epidemic-alert.service';

@ApiTags('epidemic-alert')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('epidemic-alert')
export class EpidemicAlertController {
  constructor(private epidemicAlertService: EpidemicAlertService) {}

  @Post()
  @ApiOperation({ summary: '发布疫情预警（仅疫控机构，定向推送通知）' })
  create(@Request() req, @Body() dto: any) {
    return this.epidemicAlertService.create(req.user, dto);
  }

  @Get('stats')
  @ApiOperation({ summary: '预警统计（分级/状态）' })
  stats(@Request() req) {
    return this.epidemicAlertService.stats(req.user);
  }

  @Get()
  @ApiOperation({ summary: '预警列表（机构看全部，其他角色看定向活动预警）' })
  list(@Request() req) {
    return this.epidemicAlertService.list(req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: '预警详情' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.epidemicAlertService.findOne(req.user, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新预警（含解除）' })
  update(@Request() req, @Param('id') id: string, @Body() dto: any) {
    return this.epidemicAlertService.update(req.user, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除预警' })
  remove(@Request() req, @Param('id') id: string) {
    return this.epidemicAlertService.remove(req.user, id);
  }
}
