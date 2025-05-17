import { comicStatus } from 'generated/prisma';
import { Transform } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';


export class CreateComicDto {
  @IsString()
  @IsNotEmpty({ message: 'TiTle không được bỏ trống' })
  title: string;

  @IsString()
  @IsOptional()
  title_eng: string;

  @IsString()
  @IsNotEmpty({ message: 'Slug không được bỏ trống' })
  slug: string;

  @IsString()
  @IsNotEmpty({ message: 'Description không được bỏ trống' })
  description: string;

  @IsString()
  @IsNotEmpty({ message: 'Author không được bỏ trống' })
  author: string;

  @IsOptional()
  status: comicStatus;

  @IsInt({ message: 'CountryId Phải là số nguyên' })
  @IsNotEmpty({ message: 'CountryId không được bỏ trống' })
  @Transform(({ value }) => parseInt(value))
  countryId: number;

  @IsArray({ message: 'CategoryId phải là một mảng' })
  @ArrayNotEmpty({ message: 'CategoryId không được trống' })
  @IsInt({ each: true, message: 'CategoryId phải là số nguyên' })
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map((v) => parseInt(v, 10));
    }
    return [parseInt(value)];
  })
  categoryId: number[];
}
