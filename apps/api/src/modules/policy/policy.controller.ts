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
import { PolicyService } from './policy.service';

@ApiTags('policy')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('policy')
export class PolicyController {
  constructor(private policyService: PolicyService) {}

  @Post()
  @ApiOperation({ summary: '发布政策（仅疫控机构）' })
  create(@Request() req, @Body() dto: any) {
    return this.policyService.create(req.user, dto);
  }

  @Get('stats')
  @ApiOperation({ summary: '政策已读统计（仅疫控机构）' })
  stats(@Request() req) {
    return this.policyService.stats(req.user);
  }

  @Get()
  @ApiOperation({ summary: '政策列表（机构看本人发布，其他角色看定向推送）' })
  list(@Request() req) {
    return this.policyService.list(req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: '政策详情' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.policyService.findOne(req.user, id);
  }

  @Post(':id/read')
  @ApiOperation({ summary: '标记政策已读' })
  markRead(@Request() req, @Param('id') id: string) {
    return this.policyService.markRead(req.user, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新政策（仅疫控机构）' })
  update(@Request() req, @Param('id') id: string, @Body() dto: any) {
    return this.policyService.update(req.user, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除政策（仅疫控机构）' })
  remove(@Request() req, @Param('id') id: string) {
    return this.policyService.remove(req.user, id);
  }
}
