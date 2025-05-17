import { IsNotEmpty, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsNotEmpty({ message: 'OldPassword không được để trống' })
  @MinLength(6, { message: 'Password phải có ít nhất 6 kí tự' })
  old_password: string;

  @IsNotEmpty({ message: 'NewPassword không được để trống' })
  @MinLength(6, { message: 'Password phải có ít nhất 6 kí tự' })
  new_password: string;
}
