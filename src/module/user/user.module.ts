import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PasswordService } from 'src/utils/password.service';

@Module({
  controllers: [UserController],
  providers: [UserService, PasswordService],
  exports: [UserService],
})
export class UserModule {}
