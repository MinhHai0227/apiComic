import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCountryDto {
  @IsString()
  @IsNotEmpty({ message: 'Country không được bỏ trống' })
  name: string;
}
