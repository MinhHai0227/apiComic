import { Module } from '@nestjs/common';
import { ChapterService } from './chapter.service';
import { ChapterController } from './chapter.controller';
import { ComicModule } from 'src/module/comic/comic.module';
import { BullModule } from '@nestjs/bull';
import { ViewProcessor } from 'src/module/chapter/view.processor';

@Module({
  controllers: [ChapterController],
  providers: [ChapterService, ViewProcessor],
  imports: [
    ComicModule,
    BullModule.registerQueue({
      name: 'view',
    }),
  ],
  exports: [ChapterService],
})
export class ChapterModule {}
