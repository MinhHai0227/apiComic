import { Module } from '@nestjs/common';
import { ViewhistoryService } from './viewhistory.service';
import { ViewhistoryController } from './viewhistory.controller';

@Module({
  controllers: [ViewhistoryController],
  providers: [ViewhistoryService],
  exports: [ViewhistoryService],
})
export class ViewhistoryModule {}
