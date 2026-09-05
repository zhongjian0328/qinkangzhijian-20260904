import { join } from 'path';

// 诊断图片落盘目录与对外访问前缀。
// 生产环境可把 UPLOAD_DIR 指向挂载盘，或整体替换为对象存储 SDK。
export const UPLOAD_DIR = process.env.UPLOAD_DIR ?? join(process.cwd(), 'uploads');
export const UPLOAD_URL_PREFIX = '/uploads';

// 图谱百科图片目录（静态只读，随镜像 COPY 进 apps/api/public/atlas/）
export const ATLAS_DIR = process.env.ATLAS_DIR ?? join(process.cwd(), 'public', 'atlas');
