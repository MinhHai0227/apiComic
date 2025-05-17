import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCategoryDto } from 'src/module/category/dto/create-category.dto';
import { PanigationCategoryDto } from 'src/module/category/dto/panigation-category.dto';
import { UpdateCategoryDto } from 'src/module/category/dto/update-category.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async checkCategoryExits(id: number) {
    return await this.prisma.category.findUnique({
      where: { id },
    });
  }

  async create(createCategoryDto: CreateCategoryDto) {
    const categorySlug = await this.prisma.category.findUnique({
      where: { slug: createCategoryDto.slug },
    });

    const categoryName = await this.prisma.category.findUnique({
      where: { name: createCategoryDto.name },
    });
    if (categorySlug || categoryName) {
      throw new BadRequestException('Category name/slug đã tồn tại');
    }
    const category = await this.prisma.category.create({
      data: createCategoryDto,
    });

    return {
      message: 'Thêm Category thành công',
      data: category,
    };
  }

  async findAll() {
    const categories = await this.prisma.category.findMany();
    const data = categories.map(({ create_at, update_at, ...data }) => data);
    return data;
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    const categoryExits = await this.checkCategoryExits(id);
    if (!categoryExits) {
      throw new NotFoundException('Category không tồn tại');
    }
    const category = await this.prisma.category.update({
      where: { id: id },
      data: updateCategoryDto,
    });
    return {
      message: 'Update catagory thành công',
      data: category,
    };
  }

  async remove(id: number) {
    const categoryExits = await this.checkCategoryExits(id);
    if (!categoryExits) {
      throw new NotFoundException('Category không tồn tại');
    }
    const catagory = await this.prisma.category.delete({
      where: { id: id },
    });
    return `Xóa thành công category có id ${catagory.id}`;
  }

  async checkArrayIdCategoryExits(categoryId: number[]) {
    const categories = await this.prisma.category.findMany({
      where: { id: { in: categoryId } },
    });

    const id = categories.map((category) => category.id);
    const notExitsCategories = categoryId.filter(
      (categoryId) => !id.includes(categoryId),
    );

    if (notExitsCategories && notExitsCategories.length > 0) {
      throw new NotFoundException(
        `Không tồn tại Category ${notExitsCategories.join(', ')}`,
      );
    }
    return notExitsCategories;
  }

  async findOne(slug: string, query: PanigationCategoryDto) {
    const { page, limit, status, country, sort } = query;
    const skip = (page - 1) * limit;

    const orderSort = {
      1: { create_at: 'desc' },
      2: { create_at: 'asc' },
      3: { views: 'desc' },
      4: { views: 'asc' },
    };
    const order = orderSort[sort];
    const category = await this.prisma.category.findUnique({
      where: { slug: slug },
      include: {
        comics: {
          where: {
            AND: [
              { is_active: false },
              { countryId: country },
              status ? { status: status } : {},
            ],
          },
          orderBy: order,
          take: limit,
          skip,
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
    });
    if (!category) {
      throw new NotFoundException('Categoru Slug  không tồn tại');
    }

    const { create_at, update_at, ...data } = category;

    const totalItem = await this.prisma.comic.count({
      where: {
        categories: {
          some: {
            slug: slug,
          },
        },
      },
    });
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
