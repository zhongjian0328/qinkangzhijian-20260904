import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CollaborationService } from './collaboration.service';

@ApiTags('collaboration')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('collaboration')
export class CollaborationController {
  constructor(private collaborationService: CollaborationService) {}

  @Post()
  @ApiOperation({ summary: '创建协作组（仅科研院所）' })
  create(@Request() req, @Body() dto: any) {
    return this.collaborationService.create(req.user, dto);
  }

  @Get()
  @ApiOperation({ summary: '我的协作组列表' })
  list(@Request() req) {
    return this.collaborationService.list(req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: '协作组详情（含讨论）' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.collaborationService.findOne(req.user, id);
  }

  @Post(':id/members')
  @ApiOperation({ summary: '添加协作组成员（组长）' })
  addMember(@Request() req, @Param('id') id: string, @Body() dto: any) {
    return this.collaborationService.addMember(req.user, id, dto);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: '发布讨论/共享文件（成员）' })
  postMessage(@Request() req, @Param('id') id: string, @Body() dto: any) {
    return this.collaborationService.postMessage(req.user, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '解散协作组（组长）' })
  remove(@Request() req, @Param('id') id: string) {
    return this.collaborationService.remove(req.user, id);
  }
}
