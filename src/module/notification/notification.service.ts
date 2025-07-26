import { Injectable, NotFoundException } from '@nestjs/common';
import { notifiType } from 'generated/prisma';
import { PanigationNotificationDto } from 'src/module/notification/dto/panigation-notification.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/prisma/redis.service';

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private async clearComicCache() {
    await this.redis.clearCacheByPattern('notification:getAll*');
  }

  async notifiCommentReplay(user_id: number, username: string) {
    const message = `${username} đã trả lời bình luận của bạn`;
    await this.clearComicCache();
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
    await this.clearComicCache();
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
    await this.clearComicCache();
    return await this.prisma.notification.create({
      data: {
        userId: user_id,
        message: message,
        type: notifiType.payment,
      },
    });
  }

  async deleteNotidication(id: number) {
    const check = await this.prisma.notification.findUnique({
      where: {
        id,
      },
    });
    if (!check) {
      throw new NotFoundException('Notification Id không tồn tại');
    }
    await this.clearComicCache();
    await this.prisma.notification.delete({
      where: {
        id: check.id,
      },
    });
    return `Xóa thành công Comic có id ${check.id} `;
  }

  async getAllNotificationByUser(
    user_id: number,
    query: PanigationNotificationDto,
  ) {
    const { page, limit, type } = query;
    const skip = (page - 1) * limit;

    const whereCondition = {
      userId: user_id,
      ...(type && { type }),
    };

    const notifiCache = `notification:getAll:page=${page}:limit=${limit}:type=${type}`;
    const cacheResult = await this.redis.getcache(notifiCache);
    if (cacheResult) {
      return JSON.parse(cacheResult);
    }

    const [notifications, totalItem, unseenCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: whereCondition,
        orderBy: {
          create_at: 'desc',
        },
        take: limit,
        skip,
      }),
      this.prisma.notification.count({
        where: whereCondition,
      }),
      this.prisma.notification.count({
        where: {
          ...whereCondition,
          seen: false,
        },
      }),
    ]);

    const totalPage = Math.ceil(totalItem / limit);
    const totalItemPerPage = limit;
    const currentPage = page;
    const prevPage = page > 1 ? page - 1 : 1;
    const nextPage = page < totalPage ? page + 1 : totalPage;
    const result = {
      data: notifications,
      unseenCount,
      totalItem,
      totalPage,
      totalItemPerPage,
      currentPage,
      prevPage,
      nextPage,
    };
    await this.redis.setCache(notifiCache, JSON.stringify(result), 3600);
    return result;
  }
}
