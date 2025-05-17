import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCoinDto } from 'src/module/coin/dto/create-coin.dto';
import { UpdateCoinDto } from 'src/module/coin/dto/update-coin.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CoinService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCoinDto: CreateCoinDto) {
    const coin = await this.prisma.coin.create({
      data: createCoinDto,
    });
    return {
      mesage: 'Thêm Coin thành công',
      coin,
    };
  }

  async checkCoinExits(coinId) {
    return await this.prisma.coin.findUnique({
      where: { id: coinId },
    });
  }

  async findAll() {
    return await this.prisma.coin.findMany({
      orderBy: { coin_amount: 'asc' },
    });
  }

  async update(id: number, updateCoinDto: UpdateCoinDto) {
    await this.checkCoinExits(id);
    const coin = await this.prisma.coin.update({
      where: { id: id },
      data: updateCoinDto,
    });
    return {
      mesage: 'Update Coin thành công',
      coin,
    };
  }

  async remove(id: number) {
    await this.checkCoinExits(id);
    const coin = await this.prisma.coin.delete({
      where: { id: id },
    });
    return {
      message: `Xóa thành công Coin có id ${coin.id}`,
    };
  }
}
