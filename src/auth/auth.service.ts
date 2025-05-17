import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from 'generated/prisma';
import { ChangePasswordDto } from 'src/auth/dto/change-password.dto';
import { CreateRegisterDto } from 'src/auth/dto/create-register.dto';
import { UserService } from 'src/module/user/user.service';
import { PasswordService } from 'src/utils/password.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async generateToken(user: any) {
    const payload = { id: user.id, email: user.email, role: user.role };
    const access_token = this.jwtService.sign(payload);
    const refresh_token = await this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION'),
    });
    await this.userService.createRefreshToken(user.id, refresh_token);
    return {
      access_token,
      refresh_token,
      data: payload,
    };
  }

  async validateUser(
    email: string,
    pass: string,
  ): Promise<Omit<User, 'password'> | null> {
    const user = await this.userService.findUserByEmail(email);
    if (user && user.password) {
      const isValid = await this.passwordService.comparePassword(
        pass,
        user.password,
      );
      if (!isValid) {
        return null;
      }
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const result = await this.generateToken(user);
    return result;
  }

  async register(createRegisterDto: CreateRegisterDto) {
    return this.userService.handlRegister(createRegisterDto);
  }

  async verifyRefreshToken(refreshToken: string) {
    return await this.jwtService.verify(refreshToken, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
    });
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = await this.verifyRefreshToken(refreshToken);
      const user = await this.userService.findUserByEmail(payload.email);
      if (user && user.refresh_token === refreshToken) {
        const result = await this.generateToken(user);
        await this.userService.createRefreshToken(
          user.id,
          result.refresh_token,
        );
        return result;
      } else {
        throw new UnauthorizedException('RefreshToken không trùng nhau');
      }
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Phiên đăng nhập đã hết hạn');
      } else {
        throw new BadRequestException('RefreshToken không hợp lệ');
      }
    }
  }

  async changePassword(id: number, changePasswordDto: ChangePasswordDto) {
    return await this.userService.updatePassword(id, changePasswordDto);
  }

  async signOut(id: number) {
    return await this.userService.createRefreshToken(id, null);
  }
}
