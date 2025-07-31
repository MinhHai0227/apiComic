import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateReplynotificationDto } from './dto/create-replynotification.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserService } from 'src/module/user/user.service';
import { RedisService } from 'src/prisma/redis.service';
import { Server } from 'socket.io';

@Injectable()
export class ReplynotificationService {
  private io: Server;
  constructor(
    private readonly prisma: PrismaService,
    private readonly uerService: UserService,
    private readonly redisService: RedisService,
  ) {}

  setSocketServer(io: Server) {
    this.io = io;
  }

  async notifiCommentReplay(
    data: CreateReplynotificationDto,
    userReply?: string,
  ) {
    const { userId, chapter_id, comic_id, commentId } = data;

    const notification = await this.prisma.replyNotification.create({
      data: {
        userId: userId,
        comicId: comic_id,
        chapterId: chapter_id,
        commentId: commentId,
        message: `${userReply} đã trả lời bình luận của bạn`,
      },
    });

    // Xóa cache của danh sách thông báo của người dùng
    await this.redisService.clearCacheByPattern(`notification:user=${userId}*`);

    // Gửi thông báo mới qua WebSocket
    const totalUnSeen = await this.prisma.replyNotification.count({
      where: { userId, seen: false },
    });
    this.io
      .to(`user:${notification.userId}`)
      .emit('newReplyNotification', { data: notification, totalUnSeen });

    return { success: 'Tạo thông báo thành công' };
  }

  async deleteReplyNotification(id: number) {
    const notification = await this.prisma.replyNotification.findUnique({
      where: { id },
    });
    if (!notification) {
      throw new NotFoundException('Thông báo không tồn tại');
    }

    await this.prisma.replyNotification.delete({
      where: { id },
    });

    // Xóa cache của danh sách thông báo của người dùng
    await this.redisService.clearCacheByPattern(
      `notification:user=${notification.userId}*`,
    );

    return { success: 'Xóa thông báo thành công' };
  }

  async updateNotification(id: number) {
    const notification = await this.prisma.replyNotification.findUnique({
      where: { id },
    });
    if (!notification) {
      throw new NotFoundException('Thông báo không tồn tại');
    }

    const updatedNotification = await this.prisma.replyNotification.update({
      where: { id },
      data: { seen: true },
    });

    // Xóa cache của danh sách thông báo của người dùng
    await this.redisService.clearCacheByPattern(
      `notification:user=${notification.userId}*`,
    );

    return { success: 'Bạn đã xem thông báo' };
  }

  async findAllNotificationByUser(userId: number) {
    const user = await this.uerService.checkUserExis(userId);
    if (!user) {
      throw new NotFoundException('User không kông tại');
    }
    const cacheKey = `notification:user=${userId}`;
    const cacheResult = await this.redisService.getcache(cacheKey);
    if (cacheResult) {
      return JSON.parse(cacheResult);
    }
    const [notifications, totalUnSeen] = await Promise.all([
      this.prisma.replyNotification.findMany({
        where: { userId },
        orderBy: { create_at: 'desc' },
        include: {
          comic: {
            select: {
              slug: true,
            },
          },
          chapter: {
            select: {
              slug: true,
            },
          },
        },
      }),
      this.prisma.replyNotification.count({
        where: { userId, seen: false },
      }),
    ]);
    const simplified = notifications.map((item) => ({
      id: item.id,
      userId: item.userId,
      commentId: item.commentId,
      message: item.message,
      seen: item.seen,
      create_at: item.create_at,
      slug: item.comic?.slug || item.chapter?.slug,
    }));
    const result = {
      data: simplified,
      totalUnSeen,
    };
    await this.redisService.setCache(cacheKey, JSON.stringify(result), 86400);
    return result;
  }
}
