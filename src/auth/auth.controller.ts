import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Patch,
  Post,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from 'src/auth/passport/local-auth.guard';
import { Public } from 'src/decorator/public.decorator';
import { CreateRegisterDto } from 'src/auth/dto/create-register.dto';
import { GoogleAuthGuard } from 'src/auth/passport/google-oauth.guard';
import { Response } from 'express';
import { ChangePasswordDto } from 'src/auth/dto/change-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setCookies(
    res: Response,
    access_token: string,
    refresh_token: string,
  ) {
    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  private clearCookies(res: Response) {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req, @Res() res: Response) {
    const result = await this.authService.login(req.user);
    const { access_token, refresh_token, data } = result;
    this.setCookies(res, access_token, refresh_token);
    return res.json({ data });
  }

  @Public()
  @Post('register')
  register(@Body() createRegisterDto: CreateRegisterDto) {
    return this.authService.register(createRegisterDto);
  }

  @Public()
  @Post('refresh-token')
  async refreshToken(@Request() req, @Res() res: Response) {
    const refreshToken = req.cookies['refresh_token'];
    const result = await this.authService.refreshToken(refreshToken);
    const { access_token, refresh_token, data } = result;
    this.setCookies(res, access_token, refresh_token);
    return res.json({ data });
  }

  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {}

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(@Request() req, @Res() res: Response) {
    const result = await this.authService.login(req.user);
    const { access_token, refresh_token, data } = result;
    this.setCookies(res, access_token, refresh_token);
    return res.json({ data });
  }

  @Patch('change-password')
  changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.id, changePasswordDto);
  }

  @Public()
  @Post('signout')
  async signOut(@Request() req, @Res() res: Response) {
    try {
      const refreshToken = req.cookies?.refresh_token;
      const result = await this.authService.verifyRefreshToken(refreshToken);
      await this.authService.signOut(result.id);
      this.clearCookies(res);
      return res.json({ message: 'Đăng xuất thành công' });
    } catch (error) {
      this.clearCookies(res);
      return res
        .status(HttpStatus.UNAUTHORIZED)
        .json({ message: 'Vui lòng đăng nhập lại' });
    }
  }

  @Get('profile')
  getProfile(@Request() req) {
    return { data: req.user };
  }
}
