import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UploadService } from './upload.service';

@ApiTags('upload')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('upload')
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post()
  @ApiOperation({ summary: '上传诊断图片（base64 data URI 数组）' })
  async upload(@Body() dto: { images: string[] }) {
    const urls = await Promise.all(
      (dto.images ?? []).map((image) => this.uploadService.saveDataUri(image)),
    );
    return { urls };
  }
}
