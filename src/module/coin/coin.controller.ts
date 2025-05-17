import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CoinService } from './coin.service';
import { Roles } from 'src/decorator/roles.decorator';
import { UpdateCoinDto } from 'src/module/coin/dto/update-coin.dto';
import { CreateCoinDto } from 'src/module/coin/dto/create-coin.dto';

@Controller('coin')
export class CoinController {
  constructor(private readonly coinService: CoinService) {}
  @Roles('admin')
  @Post()
  create(@Body() createCoinDto: CreateCoinDto) {
    return this.coinService.create(createCoinDto);
  }

  @Get()
  findAll() {
    return this.coinService.findAll();
  }

  @Roles('admin')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCoinDto: UpdateCoinDto,
  ) {
    return this.coinService.update(id, updateCoinDto);
  }

  @Roles('admin')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.coinService.remove(id);
  }
}
