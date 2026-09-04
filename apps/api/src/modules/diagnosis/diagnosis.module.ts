import { Module } from '@nestjs/common';
import { DiagnosisController } from './diagnosis.controller';
import { DiagnosisService } from './diagnosis.service';
import { PrismaService } from '../../common/prisma.service';

@Module({
  controllers: [DiagnosisController],
  providers: [DiagnosisService, PrismaService],
})
export class DiagnosisModule {}
