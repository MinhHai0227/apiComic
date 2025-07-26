import { InjectRedis } from '@nestjs-modules/ioredis';
import { BadRequestException, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import Redis from 'ioredis';
import {
  PanigationViewhistoryDto,
  TDate,
} from 'src/module/viewhistory/dto/panigation-viewhistory.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ViewhistoryService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectRedis() private redis: Redis,
  ) {}

  async createViewhistory(comicId: number, chapterId: number) {
    await this.prisma.view_history.create({
      data: {
        comicId,
        chapterId,
      },
    });
  }

  private getStartDateFromType(type: TDate): Date {
    const now = new Date();
    switch (type) {
      case TDate.Day:
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case TDate.Week:
        const day = now.getDay();
        const diffToMonday = day === 0 ? -6 : 1 - day;
        const monday = new Date(now);
        monday.setDate(now.getDate() + diffToMonday);
        return new Date(
          monday.getFullYear(),
          monday.getMonth(),
          monday.getDate(),
        );
      case TDate.Month:
        return new Date(now.getFullYear(), now.getMonth(), 1);
      default:
        throw new BadRequestException(`Loại thời gian không hợp lệ: ${type}`);
    }
  }

  async getPaginatedTopViews(query: PanigationViewhistoryDto) {
    const { page, limit, date, country, status } = query;
    const cacheKey = `topViews:page=${page}:limit=${limit}:date=${date}:country=${country}:status=${status}`;
    const cachedResult = await this.redis.get(cacheKey);

    if (cachedResult) {
      return JSON.parse(cachedResult);
    }
    const skip = (page - 1) * limit;
    const form = this.getStartDateFromType(date);
    const [topComics, totalDistinctComic] = await Promise.all([
      this.prisma.view_history.groupBy({
        by: ['comicId'],
        where: {
          comicId: { not: null },
          create_at: { gte: form },
          comic: {
            is_active: false,
            countryId: country,
            status: status
          },
        },
        orderBy: { _sum: { views: 'desc' } },
        skip,
        take: limit,
      }),
      this.prisma.view_history.findMany({
        where: {
          comicId: { not: null },
          create_at: {
            gte: form,
          },
        },
        distinct: ['comicId'],
      }),
    ]);

    const totalItem = totalDistinctComic.length;

    const comicIds = topComics
      .map((item) => item.comicId)
      .filter((id): id is number => id !== null);

    const comics = await this.prisma.comic.findMany({
      where: { id: { in: comicIds } },
      include: {
        chapters: {
          orderBy: { create_at: 'desc' },
          take: 1,
          select: {
            id: true,
            chapter_name: true,
            chapter_title: true,
            slug: true,
            is_locked: true,
            price_xu: true,
            auto_unlock_time: true,
            views: true,
            chapter_image_url: true,
            create_at: true,
          },
        },
      },
    });

    const customComic = comics.map(
      ({
        author,
        views,
        is_active,
        create_at,
        update_at,
        countryId,
        ...data
      }) => data,
    );

    const totalPage = Math.ceil(totalItem / limit);
    const result = {
      data: customComic,
      totalItem,
      totalPage,
      totalItemPerPage: limit,
      currentPage: page,
      prevPage: page > 1 ? page - 1 : 1,
      nextPage: page < totalPage ? page + 1 : totalPage,
    };

    await this.redis.set(cacheKey, JSON.stringify(result), 'EX', 300);
    return result;
  }

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async cleanOldViews() {
    const now = new Date();
    const firstDayOfCurrentMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    );
    const batchSize = 1000;
    try {
      while (true) {
        const oldComicView = await this.prisma.view_history.findMany({
          where: {
            create_at: {
              lt: firstDayOfCurrentMonth,
            },
          },
          select: { id: true },
          take: batchSize,
        });

        if (oldComicView.length === 0) {
          break;
        }
        const viewHistoryId = oldComicView.map((item) => item.id);
        await this.prisma.view_history.deleteMany({
          where: {
            id: { in: viewHistoryId },
          },
        });
        await new Promise((res) => setTimeout(res, 100));
      }
    } catch (error) {
      console.error('Lỗi delete old view:', error);
    }
  }
}
