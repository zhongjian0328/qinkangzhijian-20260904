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
import { CourseService } from './course.service';

@ApiTags('course')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('course')
export class CourseController {
  constructor(private courseService: CourseService) {}

  @Post()
  @ApiOperation({ summary: '创建课程（仅教师）' })
  create(@Request() req, @Body() dto: any) {
    return this.courseService.create(req.user, dto);
  }

  @Get('my-progress')
  @ApiOperation({ summary: '我的学习进度' })
  myProgress(@Request() req) {
    return this.courseService.myProgress(req.user);
  }

  @Get()
  @ApiOperation({ summary: '课程列表（学生看已发布，教师看全部）' })
  list(@Request() req) {
    return this.courseService.list(req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: '课程详情（含我的进度）' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.courseService.findOne(req.user, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新课程（仅教师）' })
  update(@Request() req, @Param('id') id: string, @Body() dto: any) {
    return this.courseService.update(req.user, id, dto);
  }

  @Post(':id/progress')
  @ApiOperation({ summary: '更新学习进度（学生）' })
  updateProgress(@Request() req, @Param('id') id: string, @Body() dto: any) {
    return this.courseService.updateProgress(req.user, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除课程（仅教师）' })
  remove(@Request() req, @Param('id') id: string) {
    return this.courseService.remove(req.user, id);
  }
}
