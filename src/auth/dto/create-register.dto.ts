import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateRegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'Username không được để trống' })
  username: string;

  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  email: string;

  @IsNotEmpty({ message: 'Password không được để trống' })
  @MinLength(6, { message: 'Password phải có ít nhất 6 kí tự' })
  password: string;
}
