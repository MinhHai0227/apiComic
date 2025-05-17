import { Transform } from 'class-transformer';
import { IsOptional, Min } from 'class-validator';

export class PanigationComichistoryDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @Min(1)
  limit: number = 10;
}
