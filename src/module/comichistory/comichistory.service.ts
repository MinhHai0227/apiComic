import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ChapterService } from 'src/module/chapter/chapter.service';
import { ComicService } from 'src/module/comic/comic.service';
import { CreateHistoryDto } from 'src/module/comichistory/dto/create-history.dto';
import { PanigationComichistoryDto } from 'src/module/comichistory/dto/panigation-comichistory.dto';
import { UserService } from 'src/module/user/user.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/prisma/redis.service';

@Injectable()
export class ComichistoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly comicService: ComicService,
    private readonly chapterService: ChapterService,
    private readonly redis: RedisService,
  ) {}

  private async clearComicHistoryCache(user_id: number) {
    await this.redis.clearCacheByPattern(
      `comicHistory:getAll:user=${user_id}*`,
    );
  }

  async getChapterlast(user_id: number, comic_id: number) {
    const comic = await this.prisma.comic_history.findUnique({
      where: {
        userId_comicId: {
          userId: user_id,
          comicId: comic_id,
        },
      },
      include: {
        chapter: {
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
    if (!comic) {
      return false;
    }
    const chapter = comic.chapter;
    return chapter;
  }

  async ensureHiatoryLimit(user_id: number) {
    const count = await this.prisma.comic_history.count({
      where: {
        userId: user_id,
      },
    });
    if (count >= 100) {
      const oldest = await this.prisma.comic_history.findFirst({
        where: {
          userId: user_id,
        },
        orderBy: { read_time: 'asc' },
      });

      if (oldest) {
        await this.prisma.comic_history.delete({
          where: {
            id: oldest.id,
          },
        });
      }
    }
  }

  async createAndUpdateComicHistory(user_id: number, dto: CreateHistoryDto) {
    const user = await this.userService.checkUserExis(user_id);
    const comic = await this.comicService.checkComicExits(dto.comic_id);
    const chapter = await this.chapterService.checkChapterExits(dto.chapter_id);
    if (!user || !comic || !chapter) {
      throw new NotFoundException('User/Comic/Chapter không tồn tại');
    }
    await this.ensureHiatoryLimit(user_id);
    const comicHistoryExits = await this.prisma.comic_history.findUnique({
      where: {
        userId_comicId: {
          userId: user_id,
          comicId: dto.comic_id,
        },
      },
    });
    if (comicHistoryExits) {
      await this.prisma.comic_history.update({
        where: {
          userId_comicId: {
            userId: user_id,
            comicId: dto.comic_id,
          },
        },
        data: {
          chapterId: dto.chapter_id,
          read_time: new Date(),
        },
      });
      await this.clearComicHistoryCache(user_id);
      return {
        message: `Đã cập nhật lịch sử Comic có ID ${dto.comic_id} với chapter có ID là ${dto.chapter_id}`,
      };
    }

    await this.prisma.comic_history.create({
      data: {
        userId: user_id,
        comicId: dto.comic_id,
        chapterId: dto.chapter_id,
      },
    });
    await this.clearComicHistoryCache(user_id);
    return {
      message: `Đã lưu lịch sử Comic có ID ${dto.comic_id} với chapter có ID là ${dto.chapter_id}`,
    };
  }

  async getAllHistoryComicByUser(
    user_id: number,
    query: PanigationComichistoryDto,
  ) {
    const { page, limit } = query;
    const cacheComicHistory = `comicHistory:getAll:user=${user_id}page=${page}:limit=${limit}`;
    const cacheResult = await this.redis.getcache(cacheComicHistory);
    if (cacheResult) {
      return JSON.parse(cacheResult);
    }
    const skip = (page - 1) * limit;
    const [totalItem, comicHistory] = await this.prisma.$transaction([
      this.prisma.comic_history.count({
        where: {
          userId: user_id,
          comic: {
            is_active: false,
          },
        },
      }),
      this.prisma.comic_history.findMany({
        where: {
          userId: user_id,
          comic: {
            is_active: false,
          },
        },
        skip,
        take: limit,
        orderBy: {
          read_time: 'desc',
        },
        include: {
          comic: {
            select: {
              id: true,
              title: true,
              title_eng: true,
              slug: true,
              status: true,
              cover_image: true,
            },
          },
          chapter: {
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
      }),
    ]);
    const totalPage = Math.ceil(totalItem / limit);
    const totalItemPerPage = limit;
    const currentPage = page;
    const prevPage = page > 1 ? page - 1 : 1;
    const nextPage = page < totalPage ? page + 1 : totalPage;
    const result = {
      data: comicHistory,
      totalItem,
      totalPage,
      totalItemPerPage,
      currentPage,
      prevPage,
      nextPage,
    };
    await this.redis.setCache(cacheComicHistory, JSON.stringify(result), 86400);
    return result;
  }

  async deleteHistoryComic(user_id: number, comic_id: number) {
    const comic = await this.prisma.comic_history.findUnique({
      where: {
        userId_comicId: {
          userId: user_id,
          comicId: comic_id,
        },
      },
    });
    if (!comic) {
      throw new BadRequestException('Bạn chưa đọc bộ này');
    }
    await this.prisma.comic_history.delete({
      where: {
        id: comic.id,
      },
    });
    await this.clearComicHistoryCache(user_id);
    return { message: `Xóa thành công comic đã đọc` };
  }
}
