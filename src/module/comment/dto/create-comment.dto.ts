import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCommentDto {
  @IsInt()
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  comic_id: number;

  @IsInt()
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  chapter_id: number;

  @IsInt()
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  parent_id: number;

  @IsString()
  @IsNotEmpty({ message: 'content không được để trống' })
  content: string;
}
