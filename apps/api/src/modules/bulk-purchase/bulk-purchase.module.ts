import { Module } from '@nestjs/common';
import { BulkPurchaseController } from './bulk-purchase.controller';
import { BulkPurchaseService } from './bulk-purchase.service';

@Module({
  controllers: [BulkPurchaseController],
  providers: [BulkPurchaseService],
})
export class BulkPurchaseModule {}
