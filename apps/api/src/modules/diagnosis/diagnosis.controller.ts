import { Controller, Get, Post, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
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
  create(
    @Request() req,
    @Body() dto: { imageUrls: string[]; species: string; symptoms: string[] },
  ) {
    return this.diagnosisService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: '获取用户诊断历史（分页）' })
  findAll(
    @Request() req,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    return this.diagnosisService.findByUser(
      req.user.id,
      take ? parseInt(take, 10) : 20,
      skip ? parseInt(skip, 10) : 0,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: '获取诊断详情' })
  findOne(@Param('id') id: string) {
    return this.diagnosisService.findById(id);
  }
}
