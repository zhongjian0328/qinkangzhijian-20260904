import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ImmunizationService } from './immunization.service';

@ApiTags('immunization')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('immunization')
export class ImmunizationController {
  constructor(private immunizationService: ImmunizationService) {}

  @Post()
  @ApiOperation({ summary: '新增免疫记录（仅养殖户）' })
  create(@Request() req, @Body() dto: any) {
    return this.immunizationService.create(req.user, dto);
  }

  @Get('stats')
  @ApiOperation({ summary: '免疫统计（计划/完成/到期）' })
  stats(@Request() req) {
    return this.immunizationService.stats(req.user);
  }

  @Get('reminders')
  @ApiOperation({ summary: '到期提醒（已逾期 + 未来7天到期）' })
  reminders(@Request() req) {
    return this.immunizationService.reminders(req.user);
  }

  @Get()
  @ApiOperation({ summary: '我的免疫记录列表（可 ?status= 过滤）' })
  list(@Request() req, @Query('status') status?: string) {
    return this.immunizationService.list(req.user, status);
  }

  @Get(':id')
  @ApiOperation({ summary: '免疫记录详情' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.immunizationService.findOne(req.user, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新免疫记录（含标记完成/逾期）' })
  update(@Request() req, @Param('id') id: string, @Body() dto: any) {
    return this.immunizationService.update(req.user, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除免疫记录' })
  remove(@Request() req, @Param('id') id: string) {
    return this.immunizationService.remove(req.user, id);
  }
}
