import { Injectable, BadRequestException } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { UPLOAD_DIR } from '../../common/upload.config';

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

@Injectable()
export class UploadService {
  /** 将 base64 data URI 图片写入磁盘，返回可访问的相对路径（如 /uploads/xxx.jpg） */
  async saveDataUri(dataUri: string): Promise<string> {
    const match = /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=\s]+)$/.exec(
      dataUri ?? '',
    );
    if (!match) {
      throw new BadRequestException('仅支持 jpeg/png/webp/gif 格式的 base64 图片');
    }

    const mime = match[1];
    const buf = Buffer.from(match[2], 'base64');
    if (buf.length === 0) throw new BadRequestException('图片数据为空');
    if (buf.length > 20 * 1024 * 1024) throw new BadRequestException('单张图片不能超过 20MB');

    const name = `${randomUUID()}.${MIME_TO_EXT[mime]}`;
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.writeFile(join(UPLOAD_DIR, name), buf);
    return `/uploads/${name}`;
  }
}
