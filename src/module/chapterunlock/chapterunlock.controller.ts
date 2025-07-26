import {
  Body,
  Controller,
  Get,
  Param,
  ParseArrayPipe,
  ParseIntPipe,
  Post,
  Request,
} from '@nestjs/common';
import { ChapterunlockService } from './chapterunlock.service';
import { UnlockChaptersDto } from 'src/module/chapterunlock/dto/unlock-chapter.dto';

@Controller('chapterunlock')
export class ChapterunlockController {
  constructor(private readonly chapterunlockService: ChapterunlockService) {}

  @Get(':chapter_id')
  checkUserUnlock(
    @Request() req,
    @Param('chapter_id', ParseIntPipe) chapter_id: number,
  ) {
    return this.chapterunlockService.checkUserUnlock(req.user.id, chapter_id);
  }

  @Post('unlock/check-lock')
  checkManyUserUnlock(
    @Request() req,
    @Body(
      'chapter_id',
      new ParseArrayPipe({
        items: Number,
        optional: true,
        separator: ',',
      }),
    )
    chapterIds: number[],
  ) {
    const userId = req.user.id;
    return this.chapterunlockService.checkManyUserUnlock(
      userId,
      chapterIds ?? [],
    );
  }

  @Post(':chapter_id')
  userUnlockChapter(
    @Request() req,
    @Param('chapter_id', ParseIntPipe) chapter_id: number,
  ) {
    return this.chapterunlockService.userUnlockChapter(req.user.id, chapter_id);
  }

  @Post('unlock/unlock-many')
  userUnlockManyChapter(
    @Request() req,
    @Body() unLockChapterDto: UnlockChaptersDto,
  ) {
    const userId = req.user.id;
    return this.chapterunlockService.userUnlockManyChapter(
      userId,
      unLockChapterDto,
    );
  }
}
