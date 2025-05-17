import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty } from 'class-validator';

export class CreateHistoryDto {

  @IsInt({ message: 'ComicId phải là số' })
  @IsNotEmpty({ message: 'ComicId không được để trống' })
  @Transform(({ value }) => parseInt(value))
  comic_id: number;

  @IsInt({ message: 'ChapterId phải là số' })
  @IsNotEmpty({ message: 'ChapterId không được để trống' })
  @Transform(({ value }) => parseInt(value))
  chapter_id: number;
}
