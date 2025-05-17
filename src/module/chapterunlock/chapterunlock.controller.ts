import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Request,
} from '@nestjs/common';
import { ChapterunlockService } from './chapterunlock.service';

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

  @Post(':chapter_id')
  userUnlockChapter(
    @Request() req,
    @Param('chapter_id', ParseIntPipe) chapter_id: number,
  ) {
    return this.chapterunlockService.userUnlockChapter(req.user.id, chapter_id);
  }
}
