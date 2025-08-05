import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ChapterService } from 'src/module/chapter/chapter.service';
import { UnlockChaptersDto } from 'src/module/chapterunlock/dto/unlock-chapter.dto';
import { NotificationService } from 'src/module/notification/notification.service';
import { UserService } from 'src/module/user/user.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/prisma/redis.service';

@Injectable()
export class ChapterunlockService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly chapterService: ChapterService,
    private readonly notificationService: NotificationService,
    private readonly redis: RedisService,
  ) {}

  private async clearUnlockChapterCache(user_id: number) {
    await this.redis.clearCacheByPattern(`unlockChapter:user:${user_id}*`);
  }

  async checkUserUnlock(user_id: number, chapter_id: number) {
    const user = await this.userService.checkUserExis(user_id);
    const chapter = await this.chapterService.checkChapterExits(chapter_id);

    if (!user || !chapter) {
      throw new NotFoundException('User/chapter không tồn tại');
    }
    const userUnlock = await this.prisma.chapter_unlock.findFirst({
      where: {
        userId: user_id,
        chapterId: chapter_id,
      },
    });
    return !!userUnlock;
  }

  async checkManyUserUnlock(user_id: number, chapterIds: number[]) {
    const cacheUserunlock = `unlockChapter:user:${user_id}:chapter:${chapterIds.join(',')}`;
    const cacheResult = await this.redis.getcache(cacheUserunlock);
    if (cacheResult) {
      return JSON.parse(cacheResult);
    }
    const chapters = await this.prisma.chapter_unlock.findMany({
      where: { userId: user_id, chapterId: { in: chapterIds } },
      select: {
        chapterId: true,
      },
    });
    if (!chapters) {
      return;
    }

    const unlockedIds = new Set(chapters.map((c) => c.chapterId));
    const status = chapterIds.map((id) => ({
      id: id,
      locked: unlockedIds.has(id),
    }));
    await this.redis.setCache(cacheUserunlock, JSON.stringify(status), 600);
    return status;
  }

  async userUnlockChapter(user_id: number, chapter_id: number) {
    const user = await this.userService.checkUserExis(user_id);
    const chapter = await this.chapterService.checkChapterExits(chapter_id);
    if (!user || !chapter) {
      throw new NotFoundException('User/chapter không tồn tại');
    }

    const checkUnlock = await this.checkUserUnlock(user_id, chapter_id);
    if (checkUnlock === true) {
      throw new BadRequestException('Bạn đã mở khóa chapter này');
    }
    const currentTime = new Date();
    const autoUnlock = currentTime > chapter.auto_unlock_time;
    if (autoUnlock) {
      throw new BadRequestException('Chapter đã được mở khóa tự động');
    }

    await this.userService.updatetotalPrice(user_id, chapter.price_xu);

    await this.notificationService.notifiUnlockChapter(user_id, chapter.slug);

    await this.prisma.chapter_unlock.create({
      data: {
        userId: user_id,
        chapterId: chapter_id,
      },
    });
    await this.clearUnlockChapterCache(user_id);
    return {
      message: `Mở khóa thành công Chapter có id ${chapter_id}`,
    };
  }

  async userUnlockManyChapter(
    user_id: number,
    unlockChapterDto: UnlockChaptersDto,
  ) {
    const user = await this.userService.checkUserExis(user_id);
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }
    const chapters = await this.chapterService.checkArrayChapterExits(
      unlockChapterDto.chapterId,
    );
    const unlocked = await this.prisma.chapter_unlock.findMany({
      where: {
        userId: user_id,
        chapterId: { in: chapters.map((chapter) => chapter.id) },
      },
      select: {
        chapterId: true,
      },
    });

    const unlockedIds = new Set(unlocked.map((u) => u.chapterId));

    const now = new Date();
    let totalPrice = 0;
    const unlockRecords: { userId: number; chapterId: number }[] = [];

    for (const chapter of chapters) {
      const isUnlocked = unlockedIds.has(chapter.id);
      const autoUnlocked = now > chapter.auto_unlock_time;
      if (isUnlocked) {
        continue;
      }
      if (autoUnlocked) {
        continue;
      }
      totalPrice += chapter.price_xu;
      unlockRecords.push({
        userId: user_id,
        chapterId: chapter.id,
      });
    }
    if (unlockRecords.length === 0) {
      throw new BadRequestException('Các chương này bạn đã mở rồi');
    }
    await this.userService.updatetotalPrice(user_id, totalPrice);
    await this.notificationService.notifiUnlockChapter(
      user_id,
      `có id ${unlockChapterDto.chapterId.join(', ')}`,
    );
    await this.prisma.chapter_unlock.createMany({
      data: unlockRecords,
      skipDuplicates: true,
    });
    await this.clearUnlockChapterCache(user_id);
    return {
      message: `Mở khóa thành công ${unlockRecords.length} chapter`,
    };
  }
}
