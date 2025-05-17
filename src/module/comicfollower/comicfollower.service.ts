import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ComicService } from 'src/module/comic/comic.service';
import { PanigationComicfollowerDto } from 'src/module/comicfollower/dto/panigation-comicfollower.dto';
import { UserService } from 'src/module/user/user.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ComicfollowerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly comicService: ComicService,
  ) {}

  async folowwerComic(user_id: number, comic_id: number) {
    const user = await this.userService.checkUserExis(user_id);
    const comic = await this.comicService.checkComicExits(comic_id);
    if (!user || !comic) {
      throw new NotFoundException('User/Comic không tồn tại');
    }
    const checkFollowerUserExits = await this.prisma.comic_follower.findFirst({
      where: {
        comicId: comic_id,
        userId: user_id,
      },
    });
    if (checkFollowerUserExits) {
      throw new BadRequestException('Bạn đã theo dỗi truyện này');
    }
    const follower = await this.prisma.comic_follower.create({
      data: {
        userId: user_id,
        comicId: comic_id,
      },
    });
    return {
      message: `Bạn theo dõi thành công Comic có id ${comic_id}`,
      data: follower,
    };
  }

  async checkComicFollowerExits(
    user_id: number,
    comic_id: number,
  ): Promise<boolean> {
    const comicFollower = await this.prisma.comic_follower.findFirst({
      where: {
        comicId: comic_id,
        userId: user_id,
      },
    });
    return !!comicFollower;
  }

  async unFollowerComic(user_id: number, comic_id: number) {
    const checkFollowerUserExits = await this.prisma.comic_follower.findFirst({
      where: {
        comicId: comic_id,
        userId: user_id,
      },
    });
    if (!checkFollowerUserExits) {
      throw new BadRequestException('Bạn chưa theo dõi truyện này');
    }
    await this.prisma.comic_follower.delete({
      where: {
        id: checkFollowerUserExits.id,
      },
    });
    return {
      message: `Bạn đã bỏ thoi dõi thành công Comic có id ${comic_id}`,
    };
  }

  async getAllFollowerComic(
    user_id: number,
    query: PanigationComicfollowerDto,
  ) {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [comics, totalItem] = await this.prisma.$transaction([
      this.prisma.comic_follower.findMany({
        where: {
          AND: [
            { userId: user_id },
            {
              comic: {
                is_active: false,
              },
            },
          ],
        },
        skip,
        take: limit,
        include: {
          comic: {
            select: {
              id: true,
              title: true,
              title_eng: true,
              slug: true,
              status: true,
              cover_image: true,
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
          },
        },
      }),

      this.prisma.comic_follower.count({
        where: {
          AND: [{ userId: user_id }, { comic: { is_active: false } }],
        },
      }),
    ]);

    const compareFn = (
      a: { chapters: { create_at: Date }[] },
      b: { chapters: { create_at: Date }[] },
    ): number => {
      const latestChapterA = a.chapters[0];
      const latestChapterB = b.chapters[0];

      if (latestChapterA.create_at > latestChapterB.create_at) {
        return -1;
      } else if (latestChapterA.create_at < latestChapterB.create_at) {
        return 1;
      }
      return 0;
    };

    const data = comics.map((comic) => comic.comic).sort(compareFn);

    const totalPage = Math.ceil(totalItem / limit);
    const totalItemPerPage = limit;
    const currentPage = page;
    const prevPage = page > 1 ? page - 1 : 1;
    const nextPage = page < totalPage ? page + 1 : totalPage;

    return {
      data,
      totalItem,
      totalPage,
      totalItemPerPage,
      currentPage,
      prevPage,
      nextPage,
    };
  }
}
