import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { ChapterService } from './chapter.service';
import { Roles } from 'src/decorator/roles.decorator';
import { CreateChapterDto } from 'src/module/chapter/dto/create-chapter.dto';
import { Public } from 'src/decorator/public.decorator';
import { UpdateChapterDto } from 'src/module/chapter/dto/update-chapter.dto';
import { Request } from 'express';

@Controller('chapter')
export class ChapterController {
  constructor(
    private readonly chapterService: ChapterService,
  ) {}

  @Roles('admin', 'editor')
  @Post()
  create(@Body() createChapterDto: CreateChapterDto) {
    return this.chapterService.create(createChapterDto);
  }

  @Public()
  @Get(':slug')
  findOneBySlug(@Param('slug') slug: string, @Req() req: Request) {
    const clientId = req.ip ?? 'unknown-client';
    return this.chapterService.findOneBySlug(slug, clientId);
  }

  @Roles('admin', 'editor')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateChapterDto: UpdateChapterDto,
  ) {
    return this.chapterService.update(id, updateChapterDto);
  }

  @Roles('admin', 'editor')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.chapterService.remove(id);
  }

  @Roles('admin', 'editor')
  @Patch('active/:id')
  islockChapter(@Param('id', ParseIntPipe) id: number) {
    return this.chapterService.islockChapter(id);
  }
}
