import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ConsultService } from './consult.service';

@ApiTags('consult')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('consult')
export class ConsultController {
  constructor(private consultService: ConsultService) {}

  @Post('message')
  @ApiOperation({ summary: '发送对话问诊消息（新建或继续会话）' })
  send(
    @Request() req,
    @Body()
    dto: {
      sessionId?: string;
      content: string;
      imageUrls?: string[];
      role?: string;
      subRole?: string;
    },
  ) {
    return this.consultService.sendMessage(req.user.id, dto);
  }

  @Get('sessions')
  @ApiOperation({ summary: '获取我的对话问诊会话列表' })
  list(@Request() req) {
    return this.consultService.listSessions(req.user.id);
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: '获取会话详情（含对话历史）' })
  get(@Request() req, @Param('id') id: string) {
    return this.consultService.getSession(req.user.id, id);
  }

  @Post('sessions/:id/report')
  @ApiOperation({ summary: '生成问诊诊断报告（基于会话内最新诊断结论）' })
  generateReport(@Request() req, @Param('id') id: string) {
    return this.consultService.generateReport(req.user.id, id);
  }

  @Delete('sessions/:id')
  @ApiOperation({ summary: '删除会话' })
  remove(@Request() req, @Param('id') id: string) {
    return this.consultService.deleteSession(req.user.id, id);
  }
}
