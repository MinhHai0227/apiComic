import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChapterService } from 'src/module/chapter/chapter.service';
import { PrismaService } from 'src/prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ChapterimageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chapterService: ChapterService,
    private readonly configService: ConfigService,
  ) {}
  async create(id: number, files: Express.Multer.File[]) {
    const chapter = await this.chapterService.checkChapterExits(id);
    if (!chapter) {
      throw new NotFoundException('Chapter không tồn tại');
    }
    const images = files.map((file) => ({
      chapterId: id,
      image_url: `${this.configService.get<string>('FILE_UPLOAD')}/${file.filename}`,
    }));
    const chapterImage = await this.prisma.chapter_image.createMany({
      data: images,
    });
    return {
      message: 'Thêm nhiều ChapterImage thành công',
      data: chapterImage,
    };
  }

  async removeAllImageByChapter(id: number) {
    const images = await this.prisma.chapter_image.findMany({
      where: { chapterId: id },
    });

    await Promise.all(
      images.map(async (image) => {
        const oldImageUrl = image.image_url.split('/uploadfile/')[1];
        const imagePath = path.join(
          __dirname,
          '..',
          '..',
          '..',
          'uploadfile',
          oldImageUrl,
        );

        try {
          await fs.promises.unlink(imagePath);
        } catch (err) {
          console.error(`Lỗi khi xóa ảnh: ${imagePath}`, err);
        }
      }),
    );

    await this.prisma.chapter_image.deleteMany({
      where: { chapterId: id },
    });

    return { message: `Xóa thành công All Image By Chapter ${id}` };
  }
}
