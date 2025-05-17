import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CoinService } from 'src/module/coin/coin.service';
import { NotificationService } from 'src/module/notification/notification.service';
import { TransactionService } from 'src/module/transaction/transaction.service';
import { UserService } from 'src/module/user/user.service';
import * as crypto from 'crypto';
import axios from 'axios';

@Injectable()
export class MomoService {
  private readonly accessKey: string;
  private readonly secretKey: string;
  private readonly ipnUrl: string;
  private readonly redirectUrl: string;
  private readonly partnerCode = 'MOMO';
  private readonly requestType = 'payWithMethod';
  private readonly lang = 'vi';
  constructor(
    private readonly userService: UserService,
    private readonly coinService: CoinService,
    private readonly transactionService: TransactionService,
    private readonly notificationService: NotificationService,
    private readonly configService: ConfigService,
  ) {
    this.accessKey = this.configService.get<string>('MOMO_ACSSESS_KEY') ?? '';
    this.secretKey = this.configService.get<string>('MOMO_SECRET_KEY') ?? '';
    this.ipnUrl = this.configService.get<string>('MOMO_IPN_URL') ?? '';
    this.redirectUrl =
      this.configService.get<string>('MOMO_REDIRECT_URL') ?? '';
  }

  async createPaymentRequest(user_id: number, coin_id: number) {
    const extraData = '';
    const orderInfo = 'Thanh Toan Nap Xu';
    const user = await this.userService.checkUserExis(user_id);
    const coin = await this.coinService.checkCoinExits(coin_id);
    if (!user || !coin) {
      throw new NotFoundException('User/Coin không tồn tại');
    }
    const transaction = await this.transactionService.createTransaction({
      userId: user_id,
      coinId: coin_id,
      coin_amount: coin.coin_amount,
      price: coin.price,
    });
    const orderId = `${transaction.data.id}_${Date.now()}`;

    const rawSignature = `accessKey=${this.accessKey}&amount=${coin.price}&extraData=${extraData}&ipnUrl=${this.ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${this.partnerCode}&redirectUrl=${this.redirectUrl}&requestId=${orderId}&requestType=${this.requestType}`;
    const signature = this.generateSignature(rawSignature);

    const requestBody = {
      partnerCode: this.partnerCode,
      partnerName: 'Test',
      storeId: 'MomoTestStore',
      requestId: orderId,
      amount: coin.price,
      orderId: orderId,
      orderInfo: orderInfo,
      redirectUrl: this.redirectUrl,
      ipnUrl: this.ipnUrl,
      lang: this.lang,
      requestType: this.requestType,
      autoCapture: true,
      extraData: extraData,
      signature: signature,
    };
    try {
      const response = await axios.post(
        'https://test-payment.momo.vn/v2/gateway/api/create',
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data;
    } catch (error) {
      throw new BadRequestException('Lỗi thanh toán MOMO');
    }
  }

  private generateSignature(rawSignature: string): string {
    return crypto
      .createHmac('sha256', this.secretKey)
      .update(rawSignature)
      .digest('hex');
  }

  async handleIPN(query: any) {
    const { orderId, resultCode, signature } = query;
    // const rawSignature = `accessKey=${this.accessKey}&amount=${query.amount}&extraData=${query.extraData}&ipnUrl=${this.ipnUrl}&orderId=${orderId}&orderInfo=${query.orderInfo}&partnerCode=${this.partnerCode}&redirectUrl=${this.redirectUrl}&requestId=${query.requestId}&requestType=${this.requestType}`;
    // const signatureCheck = this.generateSignature(rawSignature);
    // if (signatureCheck !== signature) {
    //   throw new BadRequestException('Chữ ký không hợp lệ');
    // }
    try {
      if (resultCode === 0) {
        const id = parseInt(orderId.split('_')[0]);
        const transaction =
          await this.transactionService.transactionSuccess(id);
        await this.userService.paymentUpdatecoin(
          transaction.userId,
          transaction.coin_amount,
        );
        await this.notificationService.notifiPaymetSusses(
          transaction.userId,
          transaction.price,
          transaction.coin_amount,
        );
      } else {
        const transaction = await this.transactionService.transactionError(
          parseInt(orderId),
        );
        await this.notificationService.notifiPaymetError(transaction.userId);
      }
    } catch (error) {
      throw new BadRequestException('Lỗi Update Transaction');
    }

    return {
      message: 'Thông báo thanh toán từ MoMo đã được xử lý thành công',
    };
  }
}
