import { Transform } from 'class-transformer';
import { IsOptional, IsString, Min } from 'class-validator';

export class SearchComicDto {
  @IsOptional()
  @IsString()
  keyword: string;

  @IsOptional()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  page: number = 1;

  @IsOptional()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  limit: number = 5;
}
