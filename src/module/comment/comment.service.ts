import {
  BadRequestException,
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
import { ReplynotificationService } from 'src/module/replynotification/replynotification.service';
import * as leoProfanity from 'leo-profanity';
import { UserService } from 'src/module/user/user.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/prisma/redis.service';
import { badwords } from 'src/module/comment/dto/badwords-vi';

leoProfanity.clearList();
leoProfanity.add(badwords);

@Injectable()
export class CommentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly comicService: ComicService,
    private readonly chapterService: ChapterService,
    private readonly notificationService: ReplynotificationService,
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
              orderBy: { create_at: 'asc' },
              include: {
                user: { select: { id: true, username: true, avatar: true } },
                replyTo: {
                  select: {
                    id: true,
                    content: true,
                    user: {
                      select: { id: true, username: true, avatar: true },
                    },
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

    const [comicComment, totalItem, totalComment] =
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
              orderBy: { create_at: 'asc' },
              include: {
                user: { select: { id: true, username: true, avatar: true } },
                replyTo: {
                  select: {
                    user: {
                      select: { id: true, username: true, avatar: true },
                    },
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
      totalComment,
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
    const redisKey = `user_comment_limit:${user_id}`;
    const isSpamming = await this.redis.getcache(redisKey);
    if (isSpamming) {
      throw new BadRequestException(
        'Bạn đang bình luận quá nhanh. Vui lòng chờ vài giây.',
      );
    }
    await this.redis.setCache(redisKey, '1', 15);

    let parentId = createCommentDto.parent_id;
    let replyToId = createCommentDto.replyToId;
    if (replyToId) {
      const replyToComment = await this.prisma.comment.findUnique({
        where: { id: replyToId },
      });
      if (!replyToComment)
        throw new NotFoundException('Bình luận mà bạn trả lời không tồn tại');

      parentId = replyToComment.parentId || replyToComment.id;
    }

    if (parentId) {
      const parentComment = await this.prisma.comment.findUnique({
        where: { id: parentId },
      });
      if (!parentComment)
        throw new NotFoundException('Bình luận mà bạn trả lời không tồn tại');
      if (parentComment.parentId) {
        throw new BadRequestException(
          'không thể trả lời của bình luận trả lời được',
        );
      }
    }

    const user = await this.userService.checkUserExis(user_id);
    if (!user) {
      throw new NotFoundException('User không tồn tại');
    }
    const cleanContent = leoProfanity.clean(createCommentDto.content);
    const newComment = await this.prisma.comment.create({
      data: {
        userId: user_id,
        comicId: createCommentDto.comic_id,
        chapterId: createCommentDto.chapter_id,
        parentId: createCommentDto.parent_id,
        content: cleanContent,
        replyToId,
      },
      include: {
        user: { select: { id: true, username: true } },
        replyTo: {
          select: { id: true, user: { select: { id: true, username: true } } },
        },
        parent: { select: { id: true } },
      },
    });
    if (replyToId) {
      const replyToComment = await this.prisma.comment.findUnique({
        where: { id: replyToId },
        include: { user: { select: { id: true, username: true } } },
      });
      if (replyToComment && replyToComment.userId !== user_id) {
        await this.notificationService.notifiCommentReplay(
          {
            userId: replyToComment.userId,
            chapter_id: newComment.chapterId ?? undefined,
            comic_id: newComment.comicId ?? undefined,
            commentId: newComment.id,
          },
          newComment.user.username,
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
