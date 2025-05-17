import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ChapterService } from 'src/module/chapter/chapter.service';
import { NotificationService } from 'src/module/notification/notification.service';
import { UserService } from 'src/module/user/user.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ChapterunlockService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly chapterService: ChapterService,
    private readonly notificationService: NotificationService,
  ) {}

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

    return {
      message: `Mở khóa thành công Chapter có id ${chapter_id}`,
    };
  }
}
