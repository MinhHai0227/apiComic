import { Injectable } from '@nestjs/common';
import { notifiType } from 'generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async notifiCommentReplay(user_id: number, username: string) {
    const message = `${username} đã trả lời bình luận của bạn`;
    return await this.prisma.notification.create({
      data: {
        userId: user_id,
        message: message,
        type: notifiType.reply,
      },
    });
  }

  async notifiUnlockChapter(user_id: number, chapter: string) {
    const message = `Bạn đã mở khóa chapter ${chapter} thành công`;
    return await this.prisma.notification.create({
      data: {
        userId: user_id,
        message: message,
        type: notifiType.unlock,
      },
    });
  }

  async notifiPaymetSusses(user_id: number, price: number, coin: number) {
    const message = `Bạn đã thanh toán thành công ${price} VND và được ${coin} xu`;
    return await this.prisma.notification.create({
      data: {
        userId: user_id,
        message: message,
        type: notifiType.payment,
      },
    });
  }

  async notifiPaymetError(user_id: number) {
    const message = `Bạn thanh toán không thành công!! Vui lòng thử lại`;
    return await this.prisma.notification.create({
      data: {
        userId: user_id,
        message: message,
        type: notifiType.payment,
      },
    });
  }
}
