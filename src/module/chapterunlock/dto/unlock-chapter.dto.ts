import { IsArray, ArrayNotEmpty, IsInt, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class UnlockChaptersDto {
  @IsArray({ message: 'ChapterId phải là một mảng' })
  @ArrayNotEmpty({ message: 'ChapterId không được trống' })
  @IsInt({ each: true, message: 'ChapterId phải là số nguyên' })
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map((v) => parseInt(v, 10));
    }
    return [parseInt(value)];
  })
  chapterId: number[];
}
