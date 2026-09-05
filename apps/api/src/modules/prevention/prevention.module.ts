import { Module } from '@nestjs/common';
import { PreventionController } from './prevention.controller';
import { PreventionService } from './prevention.service';

@Module({
  controllers: [PreventionController],
  providers: [PreventionService],
})
export class PreventionModule {}
