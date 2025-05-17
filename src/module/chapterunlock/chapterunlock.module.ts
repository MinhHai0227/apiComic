import { Module } from '@nestjs/common';
import { ChapterunlockService } from './chapterunlock.service';
import { ChapterunlockController } from './chapterunlock.controller';
import { UserModule } from 'src/module/user/user.module';
import { ChapterModule } from 'src/module/chapter/chapter.module';
import { NotificationModule } from 'src/module/notification/notification.module';

@Module({
  controllers: [ChapterunlockController],
  providers: [ChapterunlockService],
  imports: [UserModule, ChapterModule, NotificationModule],
})
export class ChapterunlockModule {}
