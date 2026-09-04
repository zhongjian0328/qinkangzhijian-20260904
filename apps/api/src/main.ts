import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { mkdirSync } from 'fs';
import { AppModule } from './app.module';
import { UPLOAD_DIR } from './common/upload.config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 允许 base64 图片等较大 JSON 请求体
  app.useBodyParser('json', { limit: '20mb' });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // CORS
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? ['http://localhost:8081'],
    credentials: true,
  });

  // 诊断图片静态服务（落盘文件通过 /uploads/ 对外访问）
  mkdirSync(UPLOAD_DIR, { recursive: true });
  app.useStaticAssets(UPLOAD_DIR, { prefix: '/uploads/' });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('禽康智检 API')
    .setDescription('禽康智检APP后端API文档')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 API server running on http://localhost:${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();
