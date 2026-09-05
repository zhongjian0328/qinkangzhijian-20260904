import { Controller, Get, Post, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { NotificationService } from './notification.service';

@ApiTags('notification')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('notifications')
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: '获取我的消息通知列表（可按类型筛选）' })
  list(@Request() req, @Query('type') type?: string) {
    return this.notificationService.list(req.user.id, type);
  }

  @Get('unread-count')
  @ApiOperation({ summary: '获取未读消息数' })
  unreadCount(@Request() req) {
    return this.notificationService.unreadCount(req.user.id);
  }

  @Post(':id/read')
  @ApiOperation({ summary: '标记单条消息已读' })
  markRead(@Request() req, @Param('id') id: string) {
    return this.notificationService.markRead(req.user.id, id);
  }

  @Post('read-all')
  @ApiOperation({ summary: '全部标记已读' })
  markAllRead(@Request() req) {
    return this.notificationService.markAllRead(req.user.id);
  }
}
