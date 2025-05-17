import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { UserService } from 'src/module/user/user.service';
import { PasswordService } from 'src/utils/password.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly passWordService: PasswordService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID') ?? '',
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') ?? '',
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL') ?? '',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ) {
    const { emails } = profile;
    const hash = await this.passWordService.hasPassword('123456');
    const email = emails?.[0]?.value;
    if (!email) return done(new Error('Email không tồn tại'), null);

    let user = await this.userService.findUserByEmail(email);
    if (!user) {
      user = await this.userService.createUserByGoogle(
        profile.displayName,
        email,
        hash,
      );
    }
    done(null, user);
  }
}
