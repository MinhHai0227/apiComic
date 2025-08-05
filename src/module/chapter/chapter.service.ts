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
import { RedisService } from 'src/prisma/redis.service';

@Injectable()
export class ChapterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly comicService: ComicService,
    private readonly redisService: RedisService,
    @InjectQueue('view') private viewQueue: Queue,
    @InjectRedis() private redis: Redis,
  ) {}

  private async clearChaptercache(key: string) {
    await Promise.all([
      this.redisService.delCache(key),
      this.redisService.clearCacheByPattern('unlockChapter*'),
      this.redisService.clearCacheByPattern('comic:getAll*'),
    ]);
  }

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
    await this.prisma.comic.update({
      where: {
        id: comic_id,
      },
      data: {
        create_at: data.create_at,
      },
    });
    await this.clearChaptercache(`comic:getComicbySlug:${comic.slug}`);
    return {
      message: 'Thêm Chapter thành công',
      data: newData,
    };
  }

  async findOneBySlug(slug: string, clientId: string) {
    const cacheChapter = `chapter:getChapterbySlug:${slug}`;
    const cacheResult = await this.redisService.getcache(cacheChapter);
    if (cacheResult) {
      return JSON.parse(cacheResult);
    }
    const chapter = await this.prisma.chapter.findUnique({
      where: { slug },
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

      await this.redis.incrby(`views:chapter:${chapter.id}`, 1);
      await this.redis.incrby(`views:comic:${chapter.comicId}`, 1);
    }

    const { update_at, comicId, ...data } = chapter;
    await this.redisService.setCache(cacheChapter, JSON.stringify(data), 3600);
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
    await this.clearChaptercache(`comic:getComicbySlug:${comicSlug}`);
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
    const comicSlug = chapterExits.slug.split('-chap-')[0];
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
    await this.clearChaptercache(`comic:getComicbySlug:${comicSlug}`);
    return { message: `Xóa thành công Chapter có id ${chapter.id}` };
  }

  async islockChapter(id: number) {
    const chapterExits = await this.checkChapterExits(id);
    if (!chapterExits) {
      throw new NotFoundException('Chapter không tồn tại');
    }
    const comicSlug = chapterExits.slug.split('-chap-')[0];
    const isLock = chapterExits.is_locked;
    const chapter = await this.prisma.chapter.update({
      where: { id },
      data: {
        is_locked: !isLock,
      },
    });
    await this.clearChaptercache(`comic:getComicbySlug:${comicSlug}`);
    if (chapter.is_locked === true) {
      return { message: 'Đã khóa chapter', data: chapter };
    } else {
      return { message: 'Đã mở khóa chapter', data: chapter };
    }
  }

  async updateViewByChapter(id: number, views: number) {
    const chapter = await this.checkChapterExits(id);
    if (!chapter) {
      throw new NotFoundException('Chapter không tồn tại');
    }
    await this.prisma.chapter.update({
      where: { id },
      data: {
        views: { increment: views },
      },
    });
  }

  async checkArrayChapterExits(chapter_id: number[]) {
    const chapters = await this.prisma.chapter.findMany({
      where: { id: { in: chapter_id } },
      select: {
        id: true,
        auto_unlock_time: true,
        price_xu: true,
      },
    });
    if (!chapters) {
      throw new NotFoundException('Vui lòng chọn chapter');
    }
    const ids = chapters.map((item) => item.id);
    const notExitsChapter = chapter_id.filter((id) => !ids.includes(id));
    if (notExitsChapter && notExitsChapter.length > 0) {
      throw new NotFoundException(
        `Không tồn tại Chapter ${notExitsChapter.join(', ')}`,
      );
    }
    return chapters;
  }
  // unlockChapter
  @Cron(CronExpression.EVERY_MINUTE)
  async autoUnlockChapter() {
    const page_size = 100;
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
          select: { id: true },
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
          data: { is_locked: false },
        });
        await new Promise((res) => setTimeout(res, 100));
      }
      await Promise.all([
        this.redisService.clearCacheByPattern('unlockChapter*'),
        this.redisService.clearCacheByPattern('comic:getComicbySlug*'),
      ]);
    } catch (error) {
      console.error('Lỗi update unlock chapter:', error);
    }
  }

  //updateView
  private async processViews(pattern: string, type: 'chapter' | 'comic') {
    const batchSize = 100;
    let cursor = 0;
    do {
      const [newCursor, keys] = await this.redis.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        batchSize,
      );
      cursor = parseInt(newCursor, 10);

      if (keys.length > 0) {
        try {
          await Promise.all(
            keys.map(async (key) => {
              const id = Number(key.split(':')[2]);
              const views = await this.redis.get(key);
              if (!views) return;
              const viewsCount = Number(views);
              if (viewsCount === 0) return;

              if (type === 'chapter') {
                await this.updateViewByChapter(id, viewsCount);
              } else {
                await this.comicService.updateViewByComic(id, viewsCount);
              }
              await this.redis.del(key);
            }),
          );
        } catch (error) {
          console.error('Lỗi khi xử lý view:', error);
        }
      }
    } while (cursor !== 0);
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async updateViewChapterComic() {
    await Promise.all([
      this.processViews('views:chapter:*', 'chapter'),
      this.processViews('views:comic:*', 'comic'),
    ]);
  }
}
