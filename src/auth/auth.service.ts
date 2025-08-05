import { MailerService } from '@nestjs-modules/mailer';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from 'generated/prisma';
import { ChangePasswordDto } from 'src/auth/dto/change-password.dto';
import { CreateRegisterDto } from 'src/auth/dto/create-register.dto';
import { ResetPasswordDto } from 'src/auth/dto/reset-password.dto';
import { UserService } from 'src/module/user/user.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { PasswordService } from 'src/utils/password.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
    private readonly prisma: PrismaService,
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

  async forgotPassword(email: string) {
    const user = await this.userService.findUserByEmail(email);
    if (!user) {
      throw new NotFoundException('Email không tồn tại');
    }
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const MAX_RESET_ATTEMPTS = 3;

    if (!user.lastResetAttempt || user.lastResetAttempt < startOfDay) {
      await this.prisma.user.update({
        where: { email },
        data: {
          resetAttempts: 0,
          lastResetAttempt: now,
        },
      });
    }

    if (user.resetAttempts >= MAX_RESET_ATTEMPTS) {
      throw new BadRequestException(
        'Bạn đã vượt quá số lần yêu cầu đặt lại mật khẩu trong ngày',
      );
    }
    const sendToken = await this.jwtService.sign({ email });
    const resetLink = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${sendToken}`;

    await this.prisma.user.update({
      where: { email },
      data: {
        resetPasswordToken: sendToken,
        resetAttempts: user.resetAttempts + 1,
        lastResetAttempt: now,
      },
    });

    await this.mailerService
      .sendMail({
        to: email,
        subject: 'Đặt lại mật khẩu',
        html: `
        <p>TruyenDocViet xin chào,</p>
        <p>Nhấp vào liên kết sau để đặt lại mật khẩu của bạn:</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p>Liên kết này sẽ hết hạn sau 2 giờ.</p>
        <p>Liên kết này chỉ sử dụng được một lần duy nhất.</p>
        <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
      `,
      })
      .catch(() => {
        throw new InternalServerErrorException(
          'Không thể gửi email đặt lại mật khẩu',
        );
      });

    return {
      success: 'Gửi email thành công, vui lòng kiểm tra email.',
    };
  }

  async resetPassword(data: ResetPasswordDto) {
    const { token, new_password } = data;
    let payload;

    try {
      payload = await this.jwtService.verify(token);
    } catch {
      throw new BadRequestException('Token không hợp lệ hoặc đã hết hạn');
    }

    const user = await this.userService.findUserByEmail(payload.email);
    if (!user || user.resetPasswordToken !== token) {
      throw new BadRequestException('Token không hợp lệ hoặc đã hết hạn');
    }

    const password = await this.passwordService.hasPassword(new_password);

    // Cập nhật mật khẩu và xóa resetToken
    await this.prisma.user.update({
      where: { email: payload.email },
      data: {
        password,
        resetPasswordToken: null,
      },
    });

    return {
      success: 'Đặt lại mật khẩu thành công',
    };
  }
}
