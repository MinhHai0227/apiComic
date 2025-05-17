import { Transform } from 'class-transformer';
import { IsOptional, Max, Min } from 'class-validator';
import { comicStatus } from 'generated/prisma';

export class PanigationCategoryDto {
  @IsOptional()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  page: number = 1;

  @IsOptional()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  limit: number = 10;

  @IsOptional()
  status: comicStatus;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  country: number;

  @Min(1, { message: 'Số nhỏ nhất để sort là 1' })
  @Max(4, { message: 'Số lớn nhất để sort là 4' })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  sort: number = 1;
}
