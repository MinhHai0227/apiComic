import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateChapterDto {
  @IsInt({ message: 'ComicId phải là số nguyên' })
  @IsNotEmpty({ message: 'ComicId không được bỏ trống' })
  @Transform(({ value }) => parseInt(value))
  comic_id: number;

  @IsString()
  @IsNotEmpty({ message: 'ChapterName không được bỏ trống' })
  chapter_name: string;

  @IsString()
  @IsOptional()
  chapter_title: string;

  @IsInt({ message: 'PriceXu phải là số nguyên' })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  price_xu: number;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  auto_unlock_time: Date;
}
