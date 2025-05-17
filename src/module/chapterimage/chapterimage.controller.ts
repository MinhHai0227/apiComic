import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Param,
  ParseIntPipe,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { ChapterimageService } from './chapterimage.service';
import { Roles } from 'src/decorator/roles.decorator';
import { FilesInterceptor } from '@nestjs/platform-express';
import { storage } from 'src/utils/upload.config';

@Controller('chapterimage')
export class ChapterimageController {
  constructor(private readonly chapterimageService: ChapterimageService) {}

  @Roles('admin', 'editor')
  @Post()
  @UseInterceptors(FilesInterceptor('image', 100, storage))
  create(
    @Body('chapter_id', ParseIntPipe) chapter_id: number,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Bạn chưa chọn file ảnh');
    }
    return this.chapterimageService.create(chapter_id, files);
  }

  @Roles('admin', 'editor')
  @Delete(':id')
  removeAllImageByChapter(@Param('id', ParseIntPipe) chapter_id: number) {
    return this.chapterimageService.removeAllImageByChapter(chapter_id);
  }
}
