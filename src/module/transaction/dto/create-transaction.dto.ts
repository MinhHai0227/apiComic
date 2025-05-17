import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty } from 'class-validator';

export class CreateTransactionDto {
  @IsInt()
  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value))
  coin_amount: number;

  @IsInt()
  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value))
  price: number;

  @IsInt()
  @IsNotEmpty()
  @Transform(({ value }) => parseFloat(value))
  userId: number;

  @IsInt()
  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value))
  coinId: number;
}
