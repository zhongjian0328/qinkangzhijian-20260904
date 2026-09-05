import { Module } from '@nestjs/common';
import { VetDiagnosisController } from './vet-diagnosis.controller';
import { VetDiagnosisService } from './vet-diagnosis.service';

@Module({
  controllers: [VetDiagnosisController],
  providers: [VetDiagnosisService],
})
export class VetDiagnosisModule {}