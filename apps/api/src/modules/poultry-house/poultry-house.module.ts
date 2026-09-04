import { Module } from '@nestjs/common';
import { PoultryHouseController } from './poultry-house.controller';
import { PoultryHouseService } from './poultry-house.service';

@Module({
  controllers: [PoultryHouseController],
  providers: [PoultryHouseService],
})
export class PoultryHouseModule {}
