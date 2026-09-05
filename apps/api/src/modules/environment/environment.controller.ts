import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { EnvironmentService } from './environment.service';

@ApiTags('environment')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('environment')
export class EnvironmentController {
  constructor(private environmentService: EnvironmentService) {}

  @Get('categories')
  @ApiOperation({ summary: '获取四类检测指标定义与阈值' })
  categories() {
    return this.environmentService.getCategories();
  }

  @Post('tests')
  @ApiOperation({ summary: '录入环境检测（空气/水样/饲料/表面）' })
  create(@Request() req, @Body() dto: any) {
    return this.environmentService.create(req.user.id, dto);
  }

  @Get('tests')
  @ApiOperation({ summary: '查询环境检测记录（可按禽舍/类型筛选）' })
  list(
    @Request() req,
    @Query('houseId') houseId?: string,
    @Query('category') category?: string,
  ) {
    return this.environmentService.list(req.user.id, houseId, category);
  }

  @Get('tests/:id')
  @ApiOperation({ summary: '获取单条检测记录' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.environmentService.findById(req.user.id, id);
  }

  @Delete('tests/:id')
  @ApiOperation({ summary: '删除检测记录' })
  remove(@Request() req, @Param('id') id: string) {
    return this.environmentService.remove(req.user.id, id);
  }
}
