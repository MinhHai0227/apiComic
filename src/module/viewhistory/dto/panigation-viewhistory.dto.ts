import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, Min } from 'class-validator';
import { comicStatus } from 'generated/prisma';

export enum TDate {
  Day = 'day',
  Week = 'week',
  Month = 'month',
}

export class PanigationViewhistoryDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @Min(1)
  limit: number = 10;

  @IsOptional()
  @IsEnum(TDate)
  date: TDate = TDate.Day;

  @IsOptional()
  status: comicStatus = comicStatus.onGoing;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  country: number;
}
