import { Module } from '@nestjs/common';
import { MomoService } from './momo.service';
import { MomoController } from './momo.controller';
import { UserModule } from 'src/module/user/user.module';
import { CoinModule } from 'src/module/coin/coin.module';
import { TransactionModule } from 'src/module/transaction/transaction.module';
import { NotificationModule } from 'src/module/notification/notification.module';

@Module({
  controllers: [MomoController],
  providers: [MomoService],
  imports: [UserModule, CoinModule, TransactionModule, NotificationModule],
})
export class MomoModule {}
