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
import { EpidemiologyService } from './epidemiology.service';

@ApiTags('epidemiology')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('epidemiology')
export class EpidemiologyController {
  constructor(private epidemiologyService: EpidemiologyService) {}

  @Post()
  @ApiOperation({ summary: '新增流调记录（仅疫控机构）' })
  create(@Request() req, @Body() dto: any) {
    return this.epidemiologyService.create(req.user, dto);
  }

  @Get('stats')
  @ApiOperation({ summary: '流调统计' })
  stats(@Request() req) {
    return this.epidemiologyService.stats(req.user);
  }

  @Get()
  @ApiOperation({ summary: '我的流调记录列表（可 ?status= 过滤）' })
  list(@Request() req, @Query('status') status?: string) {
    return this.epidemiologyService.list(req.user, status);
  }

  @Get(':id')
  @ApiOperation({ summary: '流调记录详情' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.epidemiologyService.findOne(req.user, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新流调记录（含处置措施/结论）' })
  update(@Request() req, @Param('id') id: string, @Body() dto: any) {
    return this.epidemiologyService.update(req.user, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除流调记录' })
  remove(@Request() req, @Param('id') id: string) {
    return this.epidemiologyService.remove(req.user, id);
  }
}
