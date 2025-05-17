import { Module } from '@nestjs/common';
import { ComichistoryService } from './comichistory.service';
import { ComichistoryController } from './comichistory.controller';
import { UserModule } from 'src/module/user/user.module';
import { ComicModule } from 'src/module/comic/comic.module';
import { ChapterModule } from 'src/module/chapter/chapter.module';

@Module({
  controllers: [ComichistoryController],
  providers: [ComichistoryService],
  imports: [UserModule, ComicModule, ChapterModule],
})
export class ComichistoryModule {}
