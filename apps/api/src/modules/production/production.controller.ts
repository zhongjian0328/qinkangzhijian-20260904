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
import { ProductionService } from './production.service';

@ApiTags('production')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('production')
export class ProductionController {
  constructor(private productionService: ProductionService) {}

  @Get('dashboard')
  @ApiOperation({ summary: '生产看板（存栏/死淘/产蛋聚合）' })
  dashboard(@Request() req) {
    return this.productionService.dashboard(req.user.id);
  }

  @Post('batches')
  @ApiOperation({ summary: '创建批次' })
  createBatch(@Request() req, @Body() dto: any) {
    return this.productionService.createBatch(req.user.id, dto);
  }

  @Get('batches')
  @ApiOperation({ summary: '获取用户所有批次' })
  listBatches(@Request() req) {
    return this.productionService.listBatches(req.user.id);
  }

  @Get('batches/:id')
  @ApiOperation({ summary: '获取批次详情（含每日记录）' })
  getBatch(@Request() req, @Param('id') id: string) {
    return this.productionService.getBatch(req.user.id, id);
  }

  @Patch('batches/:id')
  @ApiOperation({ summary: '更新批次' })
  updateBatch(@Request() req, @Param('id') id: string, @Body() dto: any) {
    return this.productionService.updateBatch(req.user.id, id, dto);
  }

  @Delete('batches/:id')
  @ApiOperation({ summary: '删除批次' })
  removeBatch(@Request() req, @Param('id') id: string) {
    return this.productionService.removeBatch(req.user.id, id);
  }

  @Post('batches/:id/records')
  @ApiOperation({ summary: '录入每日生产记录' })
  addRecord(@Request() req, @Param('id') id: string, @Body() dto: any) {
    return this.productionService.addRecord(req.user.id, id, dto);
  }

  @Get('batches/:id/records')
  @ApiOperation({ summary: '获取批次每日记录' })
  listRecords(@Request() req, @Param('id') id: string) {
    return this.productionService.listRecords(req.user.id, id);
  }

  @Delete('records/:recordId')
  @ApiOperation({ summary: '删除某条每日记录' })
  removeRecord(@Request() req, @Param('recordId') recordId: string) {
    return this.productionService.removeRecord(req.user.id, recordId);
  }
}
