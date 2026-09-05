import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { LearningService } from './learning.service';

@ApiTags('learning')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('learning')
export class LearningController {
  constructor(private learningService: LearningService) {}

  @Get('questions')
  @ApiOperation({ summary: '获取题库题目（可按章节/题型/难度筛选）' })
  getQuestions(
    @Query('chapter') chapter?: string,
    @Query('type') type?: string,
    @Query('difficulty') difficulty?: string,
    @Query('limit') limit?: string,
  ) {
    return this.learningService.getQuestions(chapter, type, difficulty, parseInt(limit ?? '20') || 20);
  }

  @Post('exams')
  @ApiOperation({ summary: '提交测验并判分' })
  submitExam(@Request() req, @Body() dto: { chapter?: string | null; answers: { questionId: string; selected: number[] }[] }) {
    return this.learningService.submitExam(req.user.id, dto);
  }

  @Get('exam-records')
  @ApiOperation({ summary: '获取我的测验记录' })
  getExamRecords(@Request() req) {
    return this.learningService.getExamRecords(req.user.id);
  }

  @Get('intern-logs')
  @ApiOperation({ summary: '获取实习日志列表（学生看自己的，导师看全部）' })
  getInternLogs(@Request() req) {
    return this.learningService.getInternLogs(req.user);
  }

  @Post('intern-logs')
  @ApiOperation({ summary: '新建实习日志' })
  createInternLog(
    @Request() req,
    @Body() dto: { title: string; content: string; logDate: string; images?: string[]; studentDiagnosis?: string },
  ) {
    return this.learningService.createInternLog(req.user.id, dto);
  }

  @Get('intern-logs/:id')
  @ApiOperation({ summary: '实习日志详情' })
  getInternLogDetail(@Request() req, @Param('id') id: string) {
    return this.learningService.getInternLogDetail(id, req.user);
  }

  @Post('intern-logs/:id/review')
  @ApiOperation({ summary: '导师批注实习日志' })
  reviewInternLog(@Request() req, @Param('id') id: string, @Body() dto: { comment: string }) {
    return this.learningService.reviewInternLog(id, req.user, dto.comment);
  }
}
