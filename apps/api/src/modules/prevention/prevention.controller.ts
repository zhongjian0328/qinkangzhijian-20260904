import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PreventionService } from './prevention.service';

@ApiTags('prevention')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('prevention')
export class PreventionController {
  constructor(private preventionService: PreventionService) {}

  @Post('generate')
  @ApiOperation({ summary: '根据诊断结果生成结构化防控预案' })
  generate(@Request() req, @Body() dto: { diagnosisId: string }) {
    return this.preventionService.generate(req.user.id, dto.diagnosisId);
  }

  @Get()
  @ApiOperation({ summary: '获取我的防控预案列表' })
  list(@Request() req) {
    return this.preventionService.list(req.user.id);
  }

  @Get(':diagnosisId')
  @ApiOperation({ summary: '按诊断记录获取防控预案（含回访）' })
  getByDiagnosis(@Request() req, @Param('diagnosisId') diagnosisId: string) {
    return this.preventionService.getByDiagnosis(req.user.id, diagnosisId);
  }

  @Post(':planId/followup')
  @ApiOperation({ summary: '记录/更新回访（3日或7日）' })
  addFollowup(@Request() req, @Param('planId') planId: string, @Body() dto: any) {
    return this.preventionService.addFollowup(req.user.id, planId, dto);
  }

  @Get(':planId/followups')
  @ApiOperation({ summary: '获取预案的回访记录' })
  listFollowups(@Request() req, @Param('planId') planId: string) {
    return this.preventionService.listFollowups(req.user.id, planId);
  }
}
