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
import { ExamPaperService } from './exam-paper.service';

@ApiTags('exam-paper')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('exam-paper')
export class ExamPaperController {
  constructor(private examPaperService: ExamPaperService) {}

  @Post()
  @ApiOperation({ summary: '创建试卷（仅教师，指定题目）' })
  create(@Request() req, @Body() dto: any) {
    return this.examPaperService.create(req.user, dto);
  }

  @Post('compose')
  @ApiOperation({ summary: '智能组卷（按章节/难度/数量从题库抽题）' })
  compose(@Request() req, @Body() dto: any) {
    return this.examPaperService.compose(req.user, dto);
  }

  @Get()
  @ApiOperation({ summary: '试卷列表（学生看已发布，教师看全部）' })
  list(@Request() req) {
    return this.examPaperService.list(req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: '试卷详情（含题目）' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.examPaperService.findOne(req.user, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新试卷（仅教师）' })
  update(@Request() req, @Param('id') id: string, @Body() dto: any) {
    return this.examPaperService.update(req.user, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除试卷（仅教师）' })
  remove(@Request() req, @Param('id') id: string) {
    return this.examPaperService.remove(req.user, id);
  }
}
