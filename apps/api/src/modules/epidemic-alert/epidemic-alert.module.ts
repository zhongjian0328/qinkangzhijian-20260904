import { Module } from '@nestjs/common';
import { EpidemicAlertController } from './epidemic-alert.controller';
import { EpidemicAlertService } from './epidemic-alert.service';

@Module({
  controllers: [EpidemicAlertController],
  providers: [EpidemicAlertService],
})
export class EpidemicAlertModule {}
