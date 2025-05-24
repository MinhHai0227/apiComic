import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { Roles } from 'src/decorator/roles.decorator';
import { PanigationUserDto } from 'src/module/user/dto/panigation-user.dto';
import { CreateUserDto } from 'src/module/user/dto/create-user.dto';
import { UpdateUserDto } from 'src/module/user/dto/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { storage } from 'src/utils/upload.config';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Roles('admin')
  @Get()
  fetchAll(@Query() query: PanigationUserDto) {
    return this.userService.fetchAll(query);
  }

  @Roles('admin')
  @Post()
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto);
  }

  @Patch(':id')
  updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.updateUser(id, updateUserDto);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', storage))
  uploadAvatar(@Request() req, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file');
    }
    return this.userService.uploadAvatar(req.user.id, file);
  }

  @Get('profile')
  findUserById(@Request() req) {
    return this.userService.findUserById(req.user.id);
  }

  @Roles('admin')
  @Delete(':id')
  deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.userService.deleteUser(id);
  }
}
