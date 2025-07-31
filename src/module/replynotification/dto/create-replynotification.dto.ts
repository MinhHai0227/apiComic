import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateReplynotificationDto {
  @IsInt()
  @Transform(({ value }) => parseInt(value))
  @IsNotEmpty()
  userId: number;

  @IsInt()
  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value))
  commentId: number;

  @IsInt()
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  comic_id?: number;

  @IsInt()
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  chapter_id?: number;
}
