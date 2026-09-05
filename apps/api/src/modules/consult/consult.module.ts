import { Module } from '@nestjs/common';
import { ConsultController } from './consult.controller';
import { ConsultService } from './consult.service';

@Module({
  controllers: [ConsultController],
  providers: [ConsultService],
})
export class ConsultModule {}
