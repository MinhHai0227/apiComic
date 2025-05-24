import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateChapterDto } from 'src/module/chapter/dto/create-chapter.dto';
import { UpdateChapterDto } from 'src/module/chapter/dto/update-chapter.dto';
import { ComicService } from 'src/module/comic/comic.service';
import { PrismaService } from 'src/prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class ChapterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly comicService: ComicService,
  ) {}

  async create(createChapterDto: CreateChapterDto) {
    const comic = await this.comicService.checkComicExits(
      createChapterDto.comic_id,
    );
    if (!comic) {
      throw new NotFoundException('Comic không tồn tại');
    }
    const { comic_id, ...newChapter } = createChapterDto;
    const data = await this.prisma.chapter.create({
      data: {
        comicId: comic_id,
        slug: `${comic.slug}-chap-${createChapterDto.chapter_name}`,
        ...newChapter,
      },
    });
    const newData = await this.prisma.chapter.update({
      where: { id: data.id },
      data: {
        chapter_image_url: `chapter/${data.slug}`,
      },
    });
    return {
      message: 'Thêm Chapter thành công',
      data: newData,
    };
  }

  async findOneBySlug(slug: string) {
    const chapter = await this.prisma.chapter.findUnique({
      where: { slug: slug },
      include: {
        chapterImages: true,
        comic: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });
    if (!chapter) {
      throw new NotFoundException('Chapter Slug không tồn tại');
    }

    const view = await this.prisma.chapter.update({
      where: {
        slug: slug,
      },
      data: {
        views: {
          increment: 1,
        },
      },
    });

    const totalView = await this.prisma.chapter.aggregate({
      _sum: {
        views: true,
      },
      where: {
        comicId: view.comicId,
      },
    });

    await this.comicService.updateViewByComic(
      view.comicId,
      totalView._sum.views || 0,
    );

    const { update_at, comicId, ...data } = chapter;
    return data;
  }

  async checkChapterExits(id: number) {
    return await this.prisma.chapter.findUnique({
      where: { id },
    });
  }

  async update(id: number, updateChapterDto: UpdateChapterDto) {
    const oldChapter = await this.checkChapterExits(id);
    if (!oldChapter) {
      throw new NotFoundException('Chapter không tồn tại');
    }
    const comicSlug = oldChapter.slug.split('-chap-')[0];
    const { comic_id, ...data } = updateChapterDto;
    const chapter = await this.prisma.chapter.update({
      where: { id },
      data: {
        slug: `${comicSlug}-chap-${updateChapterDto.chapter_name}`,
        chapter_image_url: `chapter/${comicSlug}-chap-${updateChapterDto.chapter_name}`,
        ...data,
      },
    });

    return {
      message: 'Update thành công chapter',
      data: chapter,
    };
  }

  async remove(id: number) {
    const chapterExits = await this.checkChapterExits(id);
    if (!chapterExits) {
      throw new NotFoundException('Chapter không tồn tại');
    }

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
    const chapter = await this.prisma.chapter.delete({
      where: { id },
    });
    return { message: `Xóa thành công Chapter có id ${chapter.id}` };
  }

  async islockChapter(id: number) {
    const chapterExits = await this.checkChapterExits(id);
    if (!chapterExits) {
      throw new NotFoundException('Chapter không tồn tại');
    }
    const isLock = chapterExits.is_locked;
    const chapter = await this.prisma.chapter.update({
      where: { id },
      data: {
        is_locked: !isLock,
      },
    });
    if (chapter.is_locked === true) {
      return { message: 'Đã khóa chapter', data: chapter };
    } else {
      return { message: 'Đã mở khóa chapter', data: chapter };
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async autoUnlockChapter() {
    let page = 1;
    const page_size = 50;
    const currentTime = new Date();
    try {
      while (true) {
        const chapters = await this.prisma.chapter.findMany({
          where: {
            is_locked: true,
            auto_unlock_time: {
              lt: currentTime,
            },
          },
          skip: (page - 1) * page_size,
          take: page_size,
        });

        console.log('chưa mở khóa', chapters.length);

        if (chapters.length === 0) {
          break;
        }
        await Promise.all(
          chapters.map(async (chapter) => {
            try {
              await this.prisma.chapter.update({
                where: { id: chapter.id },
                data: {
                  is_locked: false,
                },
              });
              console.log(`Chapter ${chapter.id} đã được mở khóa.`);
            } catch (error) {
              console.error(`Error updating chapter ${chapter.id}:`, error);
            }
          }),
        );
        page++;
      }
    } catch (error) {
      console.error('Error during cron job execution:', error);
    }
  }
}
