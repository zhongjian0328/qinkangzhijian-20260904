import { Controller, Get, Post, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { VetDiagnosisService } from './vet-diagnosis.service';

@ApiTags('vet-diagnosis')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('vet-diagnosis')
export class VetDiagnosisController {
  constructor(private vetDiagnosisService: VetDiagnosisService) {}

  @Post('cases')
  @ApiOperation({ summary: '创建AI兽医诊断病例（9维结构化信息），后台触发AI诊断' })
  create(@Request() req, @Body() dto: Record<string, any>) {
    return this.vetDiagnosisService.createCase(req.user.id, dto);
  }

  @Get('cases')
  @ApiOperation({ summary: '获取病例库列表（分页）' })
  findAll(
    @Request() req,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    return this.vetDiagnosisService.list(
      req.user.id,
      take ? parseInt(take, 10) : 30,
      skip ? parseInt(skip, 10) : 0,
    );
  }

  @Get('cases/:id')
  @ApiOperation({ summary: '获取病例详情（含诊断结果）' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.vetDiagnosisService.findById(req.user.id, id);
  }

  @Post('cases/:id/diagnose')
  @ApiOperation({ summary: '重新触发AI诊断（失败/草稿重试）' })
  retry(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: { role?: string; subRole?: string },
  ) {
    return this.vetDiagnosisService.retryDiagnose(
      req.user.id,
      id,
      dto?.role,
      dto?.subRole,
    );
  }

  @Post('cases/:id/feedback')
  @ApiOperation({ summary: '反馈诊断是否准确' })
  feedback(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: { feedback?: string },
  ) {
    return this.vetDiagnosisService.feedback(req.user.id, id, dto?.feedback ?? '');
  }

  @Post('offline')
  @ApiOperation({ summary: '保存离线规则引擎诊断结果' })
  offline(@Request() req, @Body() dto: Record<string, any>) {
    return this.vetDiagnosisService.saveOffline(req.user.id, dto);
  }
}