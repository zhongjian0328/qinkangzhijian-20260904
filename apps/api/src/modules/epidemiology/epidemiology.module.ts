import { Module } from '@nestjs/common';
import { EpidemiologyController } from './epidemiology.controller';
import { EpidemiologyService } from './epidemiology.service';

@Module({
  controllers: [EpidemiologyController],
  providers: [EpidemiologyService],
})
export class EpidemiologyModule {}
