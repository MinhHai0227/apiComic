import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateCoinDto {
  @IsInt({ message: 'Coin phải là số nguyên' })
  @IsNotEmpty({ message: 'Coin không được bỏ trống' })
  @Transform(({ value }) => parseInt(value))
  coin_amount: number;

  @IsNumber({}, { message: 'Price phải là một số' })
  @IsNotEmpty({ message: 'Price không được bỏ trống' })
  @Transform(({ value }) => parseFloat(value))
  price: number;
}
