import { Module } from '@nestjs/common';
import { EpidemicController } from './epidemic.controller';
import { EpidemicService } from './epidemic.service';

@Module({
  controllers: [EpidemicController],
  providers: [EpidemicService],
})
export class EpidemicModule {}
