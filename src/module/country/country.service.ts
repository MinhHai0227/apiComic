import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCountryDto } from 'src/module/country/dto/create-country.dto';
import { UpdateCountryDto } from 'src/module/country/dto/update-country.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CountryService {
  constructor(private readonly prisma: PrismaService) {}

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
    return {
      message: 'Thêm Country thành công',
      country: newCountry,
    };
  }

  async findAll() {
    const country = await this.prisma.country.findMany();
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
    return {
      message: `Xóa thành công country có id ${id}`,
    };
  }
}
