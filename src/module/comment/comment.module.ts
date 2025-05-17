import { Module } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { UserModule } from 'src/module/user/user.module';
import { ComicModule } from 'src/module/comic/comic.module';
import { ChapterModule } from 'src/module/chapter/chapter.module';
import { NotificationModule } from 'src/module/notification/notification.module';

@Module({
  controllers: [CommentController],
  providers: [CommentService],
  imports: [UserModule, ComicModule, ChapterModule, NotificationModule],
})
export class CommentModule {}
