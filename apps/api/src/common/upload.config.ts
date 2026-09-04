import { join } from 'path';

// 诊断图片落盘目录与对外访问前缀。
// 生产环境可把 UPLOAD_DIR 指向挂载盘，或整体替换为对象存储 SDK。
export const UPLOAD_DIR = process.env.UPLOAD_DIR ?? join(process.cwd(), 'uploads');
export const UPLOAD_URL_PREFIX = '/uploads';
