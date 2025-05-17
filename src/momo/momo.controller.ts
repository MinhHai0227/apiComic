import {
  BadRequestException,
  Body,
  Controller,
  ParseIntPipe,
  Post,
  Request,
} from '@nestjs/common';
import { MomoService } from './momo.service';
import { Public } from 'src/decorator/public.decorator';

@Controller('momo')
export class MomoController {
  constructor(private readonly momoService: MomoService) {}

  @Post('create')
  createPaymentRequest(
    @Request() req,
    @Body('coin_id', ParseIntPipe) coin_id: number,
  ) {
    return this.momoService.createPaymentRequest(req.user.id, coin_id);
  }

  @Public()
  @Post('ipn')
  async handleIPN(@Body() ipnData: any) {
    const result = await this.momoService.handleIPN(ipnData);
    return { resultCode: '0', message: 'Success' };
  }
}
