import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCountryDto } from 'src/module/country/dto/create-country.dto';
import { UpdateCountryDto } from 'src/module/country/dto/update-country.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/prisma/redis.service';

@Injectable()
export class CountryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private async clearCountryCache() {
    await Promise.all([
      this.redis.delCache('country:getAll'),
      this.redis.clearCacheByPattern('comic:getAll*'),
      this.redis.clearCacheByPattern('category:getcategoryByslug*'),
    ]);
  }

  async checkNameCountryExits(name: string) {
    return await this.prisma.country.findUnique({
      where: { name },
    });
  }

  async create(createCountryDto: CreateCountryDto) {
    const countryName = await this.checkNameCountryExits(createCountryDto.name);
    if (countryName) {
      throw new BadRequestException('Country đã tồn tại');
    }
    const newCountry = await this.prisma.country.create({
      data: createCountryDto,
    });

    await this.clearCountryCache();
    return {
      message: 'Thêm Country thành công',
      country: newCountry,
    };
  }

  async findAll() {
    const cacheCountry = 'country:getAll';
    const cacheResult = await this.redis.getcache(cacheCountry);
    if (cacheResult) {
      return JSON.parse(cacheResult);
    }
    const country = await this.prisma.country.findMany();
    await this.redis.setCache(cacheCountry, JSON.stringify(country), 604800);
    return country;
  }

  async checkCountryExits(id: number) {
    return await this.prisma.country.findUnique({
      where: { id },
    });
  }

  async update(id: number, updateCountryDto: UpdateCountryDto) {
    const countryExits = await this.checkCountryExits(id);
    if (!countryExits) {
      throw new NotFoundException('Country không tồn tại');
    }
    const country = await this.prisma.country.update({
      where: { id: id },
      data: updateCountryDto,
    });
    await this.clearCountryCache();
    return {
      message: 'Update Country thành công',
      country,
    };
  }

  async remove(id: number) {
    const countryExits = await this.checkCountryExits(id);
    if (!countryExits) {
      throw new NotFoundException('Country không tồn tại');
    }
    await this.prisma.country.delete({
      where: { id: id },
    });
    await this.clearCountryCache();
    return {
      message: `Xóa thành công country có id ${id}`,
    };
  }
}
