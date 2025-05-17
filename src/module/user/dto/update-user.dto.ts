import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { userRole } from 'generated/prisma';

export class UpdateUserDto {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsOptional()
  role: userRole;

  @IsOptional()
  @Transform(({ value }) => parseInt(value) || 0)
  total_coin: number;
}
