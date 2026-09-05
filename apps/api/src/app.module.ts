import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { DiagnosisModule } from './modules/diagnosis/diagnosis.module';
import { PoultryHouseModule } from './modules/poultry-house/poultry-house.module';
import { UploadModule } from './modules/upload/upload.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    DiagnosisModule,
    PoultryHouseModule,
    UploadModule,
    KnowledgeModule,
  ],
})
export class AppModule {}
