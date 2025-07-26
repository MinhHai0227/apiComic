import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { userRole } from 'generated/prisma';
import { ChapterService } from 'src/module/chapter/chapter.service';
import { ComicService } from 'src/module/comic/comic.service';
import { CreateCommentDto } from 'src/module/comment/dto/create-comment.dto';
import { PanigationCommentDto } from 'src/module/comment/dto/panigation-comment.dto';
import { UpdateCommentDto } from 'src/module/comment/dto/update-comment.dto';
import { NotificationService } from 'src/module/notification/notification.service';
import { UserService } from 'src/module/user/user.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/prisma/redis.service';

@Injectable()
export class CommentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly comicService: ComicService,
    private readonly chapterService: ChapterService,
    private readonly notificationService: NotificationService,
    private readonly redis: RedisService,
  ) {}

  async getAllCommentByChapter(
    chapter_id: number,
    query: PanigationCommentDto,
  ) {
    const { page, limit } = query;
    const cacheCommentChapterCache = `comment:getCommentByChapter:chapter=${chapter_id}:page=${page}:limit=${limit}`;
    const cacheResult = await this.redis.getcache(cacheCommentChapterCache);
    if (cacheResult) {
      return JSON.parse(cacheResult);
    }
    const skip = (page - 1) * limit;
    await this.chapterService.checkChapterExits(chapter_id);
    const [chapterComment, totalItem, totalComment] =
      await this.prisma.$transaction([
        this.prisma.comment.findMany({
          where: {
            chapterId: chapter_id,
            parentId: null,
          },
          orderBy: {
            create_at: 'desc',
          },
          take: limit,
          skip,
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
            replies: {
              select: {
                id: true,
                content: true,
                user: {
                  select: {
                    id: true,
                    username: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        }),
        this.prisma.comment.count({
          where: {
            chapterId: chapter_id,
            parentId: null,
          },
        }),
        this.prisma.comment.count({
          where: {
            chapterId: chapter_id,
          },
        }),
      ]);

    const totalPage = Math.ceil(totalItem / limit);
    const totalItemPerPage = limit;
    const currentPage = page;
    const prevPage = page > 1 ? page - 1 : 1;
    const nextPage = page < totalPage ? page + 1 : totalPage;
    const result = {
      data: chapterComment,
      totalComment,
      totalItem,
      totalPage,
      totalItemPerPage,
      currentPage,
      prevPage,
      nextPage,
    };
    await this.redis.setCache(
      cacheCommentChapterCache,
      JSON.stringify(result),
      86400,
    );
    return result;
  }

  async getAllCommentByComic(comic_id: number, query: PanigationCommentDto) {
    const { page, limit } = query;
    const cacheCommentComicCache = `comment:getCommentByComic:comic=${comic_id}:page=${page}:limit=${limit}`;
    const cacheResult = await this.redis.getcache(cacheCommentComicCache);
    if (cacheResult) {
      return JSON.parse(cacheResult);
    }
    const skip = (page - 1) * limit;
    await this.comicService.checkComicExits(comic_id);
    const [comicComment, totalItem, totalComent] =
      await this.prisma.$transaction([
        this.prisma.comment.findMany({
          where: {
            comicId: comic_id,
            parentId: null,
          },
          orderBy: {
            create_at: 'desc',
          },
          take: limit,
          skip,
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
            replies: {
              select: {
                id: true,
                content: true,
                user: {
                  select: {
                    id: true,
                    username: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        }),

        this.prisma.comment.count({
          where: {
            comicId: comic_id,
            parentId: null,
          },
        }),
        this.prisma.comment.count({
          where: {
            comicId: comic_id,
          },
        }),
      ]);

    const totalPage = Math.ceil(totalItem / limit);
    const totalItemPerPage = limit;
    const currentPage = page;
    const prevPage = page > 1 ? page - 1 : 1;
    const nextPage = page < totalPage ? page + 1 : totalPage;
    const result = {
      data: comicComment,
      totalComent,
      totalItem,
      totalPage,
      totalItemPerPage,
      currentPage,
      prevPage,
      nextPage,
    };
    await this.redis.setCache(
      cacheCommentComicCache,
      JSON.stringify(result),
      86400,
    );
    return result;
  }

  async createComment(user_id: number, createCommentDto: CreateCommentDto) {
    const user = await this.userService.checkUserExis(user_id);
    if (!user) {
      throw new NotFoundException('User không tồn tại');
    }
    const newComment = await this.prisma.comment.create({
      data: {
        userId: user_id,
        comicId: createCommentDto.comic_id,
        chapterId: createCommentDto.chapter_id,
        parentId: createCommentDto.parent_id,
        content: createCommentDto.content,
      },
      include: {
        parent: {
          select: {
            userId: true,
          },
        },
      },
    });
    if (createCommentDto.parent_id) {
      const parentComment = newComment.parent;
      if (
        parentComment?.userId != user_id &&
        parentComment?.userId != undefined
      ) {
        await this.notificationService.notifiCommentReplay(
          parentComment.userId,
          user.username,
        );
      }
    }
    if (createCommentDto.comic_id) {
      await this.redis.clearCacheByPattern(
        `comment:getCommentByComic:comic=${createCommentDto.comic_id}*`,
      );
    }
    if (createCommentDto.chapter_id) {
      await this.redis.clearCacheByPattern(
        `comment:getCommentByChapter:chapter=${createCommentDto.chapter_id}*`,
      );
    }

    return newComment;
  }

  async checkCommentExits(comment_id: number) {
    return await this.prisma.comment.findUnique({
      where: { id: comment_id },
    });
  }

  async deleteCommentByUser(user_id: number, comment_id: number) {
    const comment = await this.checkCommentExits(comment_id);
    const user = await this.userService.checkUserExis(user_id);
    if (!comment || !user) {
      throw new NotFoundException('User/Coment không tồn tại');
    }

    if (comment.userId != user.id && user.role != userRole.admin) {
      throw new ForbiddenException(
        'Bạn không thể xóa bình luận của người khác',
      );
    }

    await this.prisma.comment.delete({
      where: { id: comment_id },
    });
    if (comment.comicId) {
      await this.redis.clearCacheByPattern(
        `comment:getCommentByComic:comic=${comment.comicId}*`,
      );
    }
    if (comment.chapterId) {
      await this.redis.clearCacheByPattern(
        `comment:getCommentByChapter:chapter=${comment.chapterId}*`,
      );
    }

    return {
      message: `Xóa thành công comment có id là ${comment_id}`,
    };
  }

  async updateCommentByUser(
    user_id: number,
    comment_id: number,
    updatecommentDto: UpdateCommentDto,
  ) {
    const user = await this.userService.checkUserExis(user_id);
    const comment = await this.checkCommentExits(comment_id);
    if (!comment || !user) {
      throw new NotFoundException('User/Coment không tồn tại');
    }

    if (user.id != comment.userId) {
      throw new ForbiddenException(
        'Bạn không thể chỉnh sửa bình luận của người khác',
      );
    }
    const updateComment = await this.prisma.comment.update({
      where: {
        id: comment_id,
      },
      data: {
        content: updatecommentDto.content,
      },
    });
    if (comment.comicId) {
      await this.redis.clearCacheByPattern(
        `comment:getCommentByComic:comic=${comment.comicId}*`,
      );
    }
    if (comment.chapterId) {
      await this.redis.clearCacheByPattern(
        `comment:getCommentByChapter:chapter=${comment.chapterId}*`,
      );
    }

    return {
      message: 'Update comment thành công',
      data: updateComment,
    };
  }
}
