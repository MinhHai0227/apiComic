import { Injectable, NotFoundException } from '@nestjs/common';
import { transactionStatus } from 'generated/prisma';
import { CreateTransactionDto } from 'src/module/transaction/dto/create-transaction.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TransactionService {
  constructor(private readonly prisma: PrismaService) {}

  async createTransaction(createTransactionDto: CreateTransactionDto) {
    const transaction = await this.prisma.transaction.create({
      data: createTransactionDto,
    });
    return {
      message: ' Tạo transaction thành công',
      data: transaction,
    };
  }

  async checkTransactionExits(id: number) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
    });
    if (!transaction) {
      throw new NotFoundException('Giao dịch không tồn tại');
    }
    return transaction;
  }

  async transactionSuccess(id: number) {
    await this.checkTransactionExits(id);
    const transaction = await this.prisma.transaction.update({
      where: { id },
      data: {
        status: transactionStatus.completed,
      },
    });
    return transaction;
  }

  async transactionError(id: number) {
    await this.checkTransactionExits(id);
    const transaction = await this.prisma.transaction.update({
      where: { id },
      data: {
        status: transactionStatus.failed,
      },
    });
    return transaction;
  }

  async getPaymentStats() {
    const now = new Date();

    // === Doanh thu theo tháng ===
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayNextMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      1,
    );

    const totalThisMonth = await this.prisma.transaction.aggregate({
      where: {
        status: 'completed',
        create_at: {
          gte: firstDayOfMonth,
          lt: firstDayNextMonth,
        },
      },
      _sum: {
        price: true,
      },
    });

    // === Doanh thu theo ngày ===
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const totalToday = await this.prisma.transaction.aggregate({
      where: {
        status: 'completed',
        create_at: {
          gte: today,
          lt: tomorrow,
        },
      },
      _sum: {
        price: true,
      },
    });

    return {
      doanh_thu_theo_ngay: totalToday._sum.price || 0,
      doanh_thu_theo_thang: totalThisMonth._sum.price || 0,
    };
  }

  async getTopUsersOfMonth() {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayNextMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      1,
    );
    const topUsers = await this.prisma.transaction.groupBy({
      by: ['userId'],
      where: {
        status: 'completed',
        create_at: {
          gte: firstDayOfMonth,
          lt: firstDayNextMonth,
        },
      },
      _sum: {
        price: true,
      },
      orderBy: {
        _sum: {
          price: 'desc',
        },
      },
      take: 5,
    });

    const userIds = topUsers.map((u) => u.userId);
    const users = await this.prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
      },
    });

    // Gộp lại kết quả
    const topUserStats = topUsers.map((tu) => ({
      ...users.find((u) => u.id === tu.userId),
      total_paid: tu._sum.price,
    }));

    return topUserStats;
  }

  async getRevenueLastMonths(limit: number = 3) {
    const now = new Date();
    const currentMonth = now.getMonth() + 1; 
    const currentYear = now.getFullYear();

    const results: { month: number; year: number; total: number }[] = [];

    for (let i = 1; i <= limit; i++) {
      let month = currentMonth - i;
      let year = currentYear;

      if (month <= 0) {
        month += 12;
        year -= 1;
      }

      const firstDay = new Date(year, month - 1, 1);
      const firstDayNext = new Date(year, month, 1);

      const total = await this.prisma.transaction.aggregate({
        where: {
          status: 'completed',
          create_at: {
            gte: firstDay,
            lt: firstDayNext,
          },
        },
        _sum: {
          price: true,
        },
      });

      results.push({
        month,
        year,
        total: total._sum.price || 0,
      });
    }

    return results;
  }
}
