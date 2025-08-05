import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

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

  @IsInt()
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  replyToId: number;

  @IsString()
  @IsNotEmpty({ message: 'content không được để trống' })
  @MaxLength(500, { message: 'Nội dung không vượt quá 500 ký tự' })
  content: string;
}
