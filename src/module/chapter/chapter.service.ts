import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateChapterDto } from 'src/module/chapter/dto/create-chapter.dto';
import { UpdateChapterDto } from 'src/module/chapter/dto/update-chapter.dto';
import { ComicService } from 'src/module/comic/comic.service';
import { PrismaService } from 'src/prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class ChapterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly comicService: ComicService,
    @InjectQueue('view') private viewQueue: Queue,
    @InjectRedis() private redis: Redis,
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

  async findOneBySlug(slug: string, clientId: string) {
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

    const sessionKey = `view:chapter:${chapter.id}:client:${clientId}`;
    const existingSession = await this.redis.get(sessionKey);

    if (!existingSession) {
      await this.redis.set(sessionKey, '1', 'EX', 3600);

      await this.viewQueue.add('record-view', {
        chapterId: chapter.id,
        comicId: chapter.comicId,
      });

      await this.redis.incr(`views:chapter:${chapter.id}`);
      await this.redis.incr(`views:comic:${chapter.comicId}`);
    }

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
  // unlockChapter
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

        if (chapters.length === 0) {
          break;
        }

        const chapterIds = chapters.map((c) => c.id);
        await this.prisma.chapter.updateMany({
          where: {
            id: { in: chapterIds },
          },
          data: {
            is_locked: false,
          },
        });
        page++;
      }
    } catch (error) {
      console.error('Error during cron job execution:', error);
    }
  }

  //updateView

  private async processViews(pattern: string, type: 'chapter' | 'comic') {
    const BATCH_SIZE = 100;
    const keys = await this.redis.keys(pattern);
    if (keys.length === 0) {
      return;
    }
    for (let i = 0; i < keys.length; i += BATCH_SIZE) {
      const batch = keys.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (key) => {
          try {
            const id = Number(key.split(':')[2]);
            if (type === 'chapter') {
              await this.prisma.chapter.update({
                where: { id },
                data: { views: { increment: 1 } },
              });
            } else {
              await this.comicService.updateViewByComic(id, 1);
            }
            await this.redis.del(key);
          } catch (error) {
            console.error(`Error processing key ${key}:`, error);
          }
        }),
      );
    }
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async updateViewChapterComic() {
    await this.processViews('views:chapter:*', 'chapter');
    await this.processViews('views:comic:*', 'comic');
  }
}
