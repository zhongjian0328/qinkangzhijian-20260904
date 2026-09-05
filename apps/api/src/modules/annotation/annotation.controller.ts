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
import { AnnotationService } from './annotation.service';

@ApiTags('annotation')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('annotation')
export class AnnotationController {
  constructor(private annotationService: AnnotationService) {}

  @Post()
  @ApiOperation({ summary: '新建标注（仅科研院所）' })
  create(@Request() req, @Body() dto: any) {
    return this.annotationService.create(req.user, dto);
  }

  @Get('stats')
  @ApiOperation({ summary: '标注池统计（待标注/已标注/特殊）' })
  stats(@Request() req) {
    return this.annotationService.stats(req.user);
  }

  @Get('pool')
  @ApiOperation({ summary: '标注池（全体标注）' })
  pool(@Request() req) {
    return this.annotationService.pool(req.user);
  }

  @Get()
  @ApiOperation({ summary: '我的标注列表' })
  list(@Request() req) {
    return this.annotationService.list(req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: '标注详情' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.annotationService.findOne(req.user, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新标注' })
  update(@Request() req, @Param('id') id: string, @Body() dto: any) {
    return this.annotationService.update(req.user, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除标注' })
  remove(@Request() req, @Param('id') id: string) {
    return this.annotationService.remove(req.user, id);
  }
}
