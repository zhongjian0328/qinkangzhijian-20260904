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
import { EpidemicService } from './epidemic.service';

@ApiTags('epidemic')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('epidemic')
export class EpidemicController {
  constructor(private epidemicService: EpidemicService) {}

  @Post()
  @ApiOperation({ summary: '上报疫情' })
  create(@Request() req, @Body() dto: any) {
    return this.epidemicService.create(req.user.id, dto);
  }

  @Get('statistics')
  @ApiOperation({ summary: '区域疫情聚合统计' })
  statistics() {
    return this.epidemicService.statistics();
  }

  @Get()
  @ApiOperation({ summary: '我的疫情上报列表' })
  list(@Request() req) {
    return this.epidemicService.list(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单条上报记录' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.epidemicService.findById(req.user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新上报记录（级别/数量等）' })
  update(@Request() req, @Param('id') id: string, @Body() dto: any) {
    return this.epidemicService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除上报记录' })
  remove(@Request() req, @Param('id') id: string) {
    return this.epidemicService.remove(req.user.id, id);
  }
}
