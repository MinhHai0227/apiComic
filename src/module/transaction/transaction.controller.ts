import { Controller, Get, Query } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { Roles } from 'src/decorator/roles.decorator';

@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Roles('admin')
  @Get('stat/payment')
  async getPaymentStats() {
    return this.transactionService.getPaymentStats();
  }

  @Roles('admin')
  @Get('stat/top-user')
  async getTopUsersOfMonth() {
    return this.transactionService.getTopUsersOfMonth();
  }

  @Roles('admin')
  @Get('stat/revenue/recent')
  async getRevenueLastMonths(@Query('limit') limit: number) {
    return this.transactionService.getRevenueLastMonths(limit);
  }
}
