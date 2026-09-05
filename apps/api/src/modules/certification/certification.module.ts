import { Module } from '@nestjs/common';
import { CertificationController } from './certification.controller';
import { CertificationService } from './certification.service';

@Module({
  controllers: [CertificationController],
  providers: [CertificationService],
})
export class CertificationModule {}
