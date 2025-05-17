import { Transform } from 'class-transformer';
import { IsOptional, Min } from 'class-validator';
import { userRole } from 'generated/prisma';

export class PanigationUserDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @Min(1)
  limit: number = 10;

  @IsOptional()
  search: string;

  @IsOptional()
  role: userRole;
}
