import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CategoryService } from 'src/module/category/category.service';
import { CreateComicDto } from 'src/module/comic/dto/create-comic.dto';
import { PanigationComicDto } from 'src/module/comic/dto/panigation_comic.dto';
import { UpdateComicDto } from 'src/module/comic/dto/update-comic.dto';
import { CountryService } from 'src/module/country/country.service';
import { PrismaService } from 'src/prisma/prisma.service';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class ComicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly categoryService: CategoryService,
    private readonly countryService: CountryService,
    private readonly configService: ConfigService,
  ) {}

  async create(createComicDto: CreateComicDto, file: Express.Multer.File) {
    const comicSlug = await this.prisma.comic.findUnique({
      where: { slug: createComicDto.slug },
    });

    const comicTitle = await this.prisma.comic.findUnique({
      where: { title: createComicDto.title },
    });
    if (comicSlug || comicTitle) {
      throw new BadRequestException('Category title/slug đã tồn tại');
    }

    const country = await this.countryService.checkCountryExits(
      createComicDto.countryId,
    );
    if (!country) {
      throw new NotFoundException('Country không tồn tại');
    }
    await this.categoryService.checkArrayIdCategoryExits(
      createComicDto.categoryId,
    );
    const { categoryId, ...data } = createComicDto;

    const comic = await this.prisma.comic.create({
      data: {
        cover_image: `${this.configService.get<string>('FILE_UPLOAD')}/${file.filename}`,
        categories: {
          connect: categoryId.map((id) => ({ id: id })),
        },
        ...data,
      },
    });

    return {
      message: 'Thêm Comic thành công',
      data: comic,
    };
  }

  async findAll(query: PanigationComicDto) {
    const { page, limit, search, status, country, active } = query;
    const skip = (page - 1) * limit;
    const comics = await this.prisma.comic.findMany({
      take: limit,
      skip,
      orderBy: { create_at: 'desc' },
      where: {
        AND: [
          status ? { status: status } : {},
          { countryId: country },
          { is_active: active },
          {
            OR: [
              { title: { contains: search } },
              { title_eng: { contains: search } },
            ],
          },
        ],
      },
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
    const totalItem = await this.prisma.comic.count({
      where: {
        is_active: false,
      },
    });
    const totalPage = Math.ceil(totalItem / limit);
    const totalItemPerPage = limit;
    const currentPage = page;
    const prevPage = page > 1 ? page - 1 : 1;
    const nextPage = page < totalPage ? page + 1 : totalPage;
    return {
      data: customComic,
      totalItem,
      totalPage,
      totalItemPerPage,
      currentPage,
      prevPage,
      nextPage,
    };
  }

  async checkComicExits(id: number) {
    return await this.prisma.comic.findUnique({
      where: { id },
    });
  }

  async update(
    id: number,
    updateComicDto: UpdateComicDto,
    file: Express.Multer.File,
  ) {
    await this.categoryService.checkArrayIdCategoryExits(
      updateComicDto.categoryId || [],
    );
    const checkComic = await this.checkComicExits(id);
    if (!checkComic) {
      throw new NotFoundException('Comic không tồn tại');
    }
    if (checkComic.cover_image) {
      const fileComic = checkComic.cover_image.split('/uploadfile/')[1];
      const oldComicFile = path.join(
        __dirname,
        '..',
        '..',
        '..',
        'uploadfile',
        fileComic,
      );
      try {
        if (fs.existsSync(oldComicFile)) {
          fs.unlinkSync(oldComicFile);
        }
      } catch {
        throw new BadRequestException('Không thể xóa ảnh | Ảnh không tồn tại');
      }
    }
    const { categoryId, ...data } = updateComicDto;
    const comic = await this.prisma.comic.update({
      where: { id: id },
      data: {
        cover_image: `${this.configService.get<string>('FILE_UPLOAD')}/${file.filename}`,
        categories: {
          connect: categoryId?.map((id) => ({ id: id })),
        },
        ...data,
      },
    });
    return {
      message: 'Cập nhật Comic thành công',
      data: comic,
    };
  }

  async remove(id: number) {
    const checkComic = await this.checkComicExits(id);
    if (!checkComic) {
      throw new NotFoundException('Comic không tồn tại');
    }

    if (checkComic.cover_image) {
      const fileComic = checkComic.cover_image.split('/uploadfile/')[1];
      const oldComicFile = path.join(
        __dirname,
        '..',
        '..',
        '..',
        'uploadfile',
        fileComic,
      );
      try {
        if (fs.existsSync(oldComicFile)) {
          fs.unlinkSync(oldComicFile);
        }
      } catch {
        throw new BadRequestException('Không thể xóa ảnh | Ảnh không tồn tại');
      }
      const comic = await this.prisma.comic.delete({
        where: { id: id },
      });

      return `Xóa thành công Comic có id ${comic.id} `;
    }
  }

  async findOne(slug: string) {
    const comic = await this.prisma.comic.findUnique({
      where: { slug: slug },
      include: {
        categories: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        chapters: {
          orderBy: { create_at: 'desc' },
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
      throw new NotFoundException('Comic Slug không tồn tại');
    }
    const { is_active, create_at, update_at, countryId, ...data } = comic;
    return data;
  }

  async setIsActiveComic(id: number) {
    const comic = await this.checkComicExits(id);
    if (!comic) {
      throw new NotFoundException('Comic không tồn tại');
    }
    const isActive = comic.is_active;
    const setComicActive = await this.prisma.comic.update({
      where: { id },
      data: {
        is_active: !isActive,
      },
    });

    if (setComicActive.is_active === false) {
      return {
        message: `set show comic ${setComicActive.title} thành công `,
      };
    } else {
      return {
        message: `set hide comic ${setComicActive.title} thành công `,
      };
    }
  }

  async updateViewByComic(comic_id: number, views: number) {
    const comic = await this.checkComicExits(comic_id);
    if (!comic) {
      throw new NotFoundException('comic không tồn tại');
    }
    await this.prisma.comic.update({
      where: {
        id: comic_id,
      },
      data: {
        views: {
          increment: views,
        },
      },
    });
  }
}
