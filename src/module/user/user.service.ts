import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateRegisterDto } from 'src/auth/dto/create-register.dto';
import { CreateUserDto } from 'src/module/user/dto/create-user.dto';
import { PanigationUserDto } from 'src/module/user/dto/panigation-user.dto';
import { UpdateUserDto } from 'src/module/user/dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PasswordService } from 'src/utils/password.service';
import * as path from 'path';
import * as fs from 'fs';
import { ChangePasswordDto } from 'src/auth/dto/change-password.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly configService: ConfigService,
  ) {}

  async findUserByEmail(email: string) {
    return await this.prisma.user.findUnique({
      where: { email },
    });
  }

  async createRefreshToken(id: number, refreshToken: string | null) {
    await this.prisma.user.update({
      where: { id },
      data: {
        refresh_token: refreshToken,
      },
    });
  }

  async handlRegister(createRegisterrDto: CreateRegisterDto) {
    const { username, email, password } = createRegisterrDto;
    const user = await this.findUserByEmail(email);
    const hashPass = await this.passwordService.hasPassword(password);
    if (user) {
      throw new BadRequestException('Email đã tồn tại');
    }
    const registerUser = await this.prisma.user.create({
      data: {
        username: username,
        email: email,
        password: hashPass,
      },
    });

    return {
      message: 'User đăng kí thành công',
      id: registerUser.id,
    };
  }

  async createUserByGoogle(name: string, email: string, password: string) {
    return await this.prisma.user.create({
      data: {
        username: name,
        email: email,
        password: password,
      },
    });
  }

  async updatePassword(id: number, changePasswordDto: ChangePasswordDto) {
    const user = await this.checkUserExis(id);
    if (!user) {
      throw new NotFoundException('User không tồn tại');
    }
    const isvalid = await this.passwordService.comparePassword(
      changePasswordDto.old_password,
      user.password,
    );
    if (!isvalid) {
      throw new BadRequestException('Mật khẩu hiện tại không chính xác');
    }

    const hashPass = await this.passwordService.hasPassword(
      changePasswordDto.new_password,
    );
    await this.prisma.user.update({
      where: { id },
      data: {
        password: hashPass,
      },
    });
    return {
      message: 'Đổi mật khẩu thành công',
      id: id,
    };
  }

  async fetchAll(query: PanigationUserDto) {
    const { page, limit, search, role } = query;

    const skip = (page - 1) * limit;
    const users = await this.prisma.user.findMany({
      orderBy: { create_at: 'desc' },
      skip,
      take: limit,
      where: {
        AND: [
          {
            OR: [
              {
                username: {
                  contains: search,
                },
              },
              {
                email: {
                  contains: search,
                },
              },
            ],
          },
          role ? { role: role } : {},
        ],
      },
    });
    const data = users.map(
      ({ password, refresh_token, create_at, update_at, ...user }) => user,
    );
    const totalItem = await this.prisma.user.count({
      where: {
        role: role,
      },
    });
    const totalPage = Math.ceil(totalItem / limit);
    const totalItemPerPage = limit;
    const currentPage = page;
    const prevPage = page > 1 ? page - 1 : 1;
    const nextPage = page < totalPage ? page + 1 : totalPage;
    return {
      data,
      totalItem,
      totalPage,
      totalItemPerPage,
      currentPage,
      prevPage,
      nextPage,
    };
  }

  async createUser(createUserDto: CreateUserDto) {
    const hashPass = await this.passwordService.hasPassword(
      createUserDto.password,
    );
    const user = await this.findUserByEmail(createUserDto.email);
    if (user) {
      throw new BadRequestException('Email đã tồn tại');
    }
    const { password, ...data } = createUserDto;
    const registerUser = await this.prisma.user.create({
      data: {
        password: hashPass,
        ...data,
      },
    });

    return {
      message: 'đăng kí Role thành công',
      id: registerUser.id,
    };
  }

  async checkUserExis(id: number) {
    return await this.prisma.user.findUnique({
      where: {
        id,
      },
    });
  }

  async updateUser(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.checkUserExis(id);
    if (!user) {
      throw new NotFoundException('User không tồn tại');
    }
    await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
    return {
      message: 'Update thành công',
      id: id,
    };
  }

  async uploadAvatar(id: number, file: Express.Multer.File) {
    const user = await this.checkUserExis(id);

    if (user && user.avatar) {
      const fileAvatar = user.avatar.split('/uploadfile/')[1];
      const oldAvatarPath = path.join(
        __dirname,
        '..',
        '..',
        '..',
        'uploadfile',
        fileAvatar,
      );
      try {
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      } catch {
        throw new BadRequestException('Không thể xóa ảnh | Ảnh không tồn tại');
      }
    }
    const upload = await this.prisma.user.update({
      where: { id },
      data: {
        avatar: `${this.configService.get<string>('FILE_UPLOAD')}/${file.filename}`,
      },
    });

    return {
      message: 'Upload avatar thành công',
      avatar: upload.avatar,
    };
  }

  async deleteUser(id: number) {
    const user = await this.checkUserExis(id);
    if (!user) {
      throw new NotFoundException('User không tồn tại');
    }
    if (user.avatar) {
      const fileAvatar = user.avatar.split('/uploadfile/')[1];
      const oldAvatarPath = path.join(
        __dirname,
        '..',
        '..',
        '..',
        'uploadfile',
        fileAvatar,
      );
      try {
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      } catch {
        throw new BadRequestException('Không thể xóa ảnh');
      }
    }
    await this.prisma.user.delete({
      where: { id },
    });
    return {
      message: `Xóa thành công User có id ${user.id}`,
    };
  }

  async updatetotalPrice(user_id: number, price_coin: number) {
    const user = await this.checkUserExis(user_id);
    if (!user) {
      throw new NotFoundException('User không tồn tại');
    }
    const checkTotalPrice = user.total_coin > price_coin;
    if (!checkTotalPrice) {
      throw new BadRequestException('bạn không đủ xu');
    }
    return await this.prisma.user.update({
      where: { id: user_id },
      data: {
        total_coin: {
          decrement: price_coin,
        },
      },
    });
  }

  async paymentUpdatecoin(user_id: number, price_coin: number) {
    await this.checkUserExis(user_id);
    return await this.prisma.user.update({
      where: { id: user_id },
      data: {
        total_coin: {
          increment: price_coin,
        },
      },
    });
  }
}
