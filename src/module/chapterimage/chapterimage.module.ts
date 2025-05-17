import { Module } from '@nestjs/common';
import { ChapterimageService } from './chapterimage.service';
import { ChapterimageController } from './chapterimage.controller';
import { ChapterModule } from 'src/module/chapter/chapter.module';

@Module({
  controllers: [ChapterimageController],
  providers: [ChapterimageService],
  imports: [ChapterModule],
})
export class ChapterimageModule {}
