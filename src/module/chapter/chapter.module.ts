import { Module } from '@nestjs/common';
import { ChapterService } from './chapter.service';
import { ChapterController } from './chapter.controller';
import { ComicModule } from 'src/module/comic/comic.module';

@Module({
  controllers: [ChapterController],
  providers: [ChapterService],
  imports: [ComicModule],
  exports: [ChapterService],
})
export class ChapterModule {}
