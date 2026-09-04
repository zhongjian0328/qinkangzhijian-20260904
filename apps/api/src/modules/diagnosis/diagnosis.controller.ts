import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { DiagnosisService } from './diagnosis.service';

@ApiTags('diagnosis')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('diagnosis')
export class DiagnosisController {
  constructor(private diagnosisService: DiagnosisService) {}

  @Post()
  @ApiOperation({ summary: '创建AI诊断任务' })
  create(@Request() req, @Body() dto: { imageUrl: string; species: string; symptoms: string[] }) {
    return this.diagnosisService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: '获取用户诊断历史' })
  findAll(@Request() req) {
    return this.diagnosisService.findByUser(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取诊断详情' })
  findOne(@Param('id') id: string) {
    return this.diagnosisService.findById(id);
  }
}
