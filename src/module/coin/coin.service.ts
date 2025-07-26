import { Injectable } from '@nestjs/common';
import { CreateCoinDto } from 'src/module/coin/dto/create-coin.dto';
import { UpdateCoinDto } from 'src/module/coin/dto/update-coin.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/prisma/redis.service';

@Injectable()
export class CoinService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private async clearCoinCache() {
    await this.redis.delCache('coin:getAll');
  }

  async create(createCoinDto: CreateCoinDto) {
    const coin = await this.prisma.coin.create({
      data: createCoinDto,
    });
    await this.clearCoinCache();
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
    const cacheCoin = 'coin:getAll';
    const cacheResult = await this.redis.getcache(cacheCoin);
    if (cacheResult) {
      return JSON.parse(cacheResult);
    }
    const coin = await this.prisma.coin.findMany({
      orderBy: { coin_amount: 'asc' },
    });
    await this.redis.setCache(cacheCoin, JSON.stringify(coin), 604800);
    return coin;
  }

  async update(id: number, updateCoinDto: UpdateCoinDto) {
    await this.checkCoinExits(id);
    const coin = await this.prisma.coin.update({
      where: { id: id },
      data: updateCoinDto,
    });
    await this.clearCoinCache();
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
    await this.clearCoinCache();
    return {
      message: `Xóa thành công Coin có id ${coin.id}`,
    };
  }
}
