import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CertificationService } from './certification.service';

@ApiTags('certification')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('certification')
export class CertificationController {
  constructor(private certificationService: CertificationService) {}

  @Post()
  @ApiOperation({ summary: '提交/重新提交身份认证' })
  submit(@Request() req, @Body() dto: { type?: string; data?: Record<string, string>; images?: string[] }) {
    return this.certificationService.submit(req.user, dto);
  }

  @Get('mine')
  @ApiOperation({ summary: '获取我的认证状态' })
  getMine(@Request() req) {
    return this.certificationService.getMine(req.user.id);
  }

  @Get('pending')
  @ApiOperation({ summary: '待审核认证列表（管理员/机构）' })
  listPending(@Request() req) {
    return this.certificationService.listPending(req.user);
  }

  @Post(':id/review')
  @ApiOperation({ summary: '审核认证（通过/驳回）' })
  review(@Request() req, @Param('id') id: string, @Body() dto: { status?: string; reviewerNote?: string }) {
    return this.certificationService.review(id, req.user, dto);
  }
}
