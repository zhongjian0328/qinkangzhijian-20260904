import { Module } from '@nestjs/common';
import { PoultryHouseController } from './poultry-house.controller';
import { PoultryHouseService } from './poultry-house.service';
import { PrismaService } from '../../common/prisma.service';

@Module({
  controllers: [PoultryHouseController],
  providers: [PoultryHouseService, PrismaService],
})
export class PoultryHouseModule {}
