import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordService {
  private readonly saltRounds = 10;
  async hasPassword(password: string): Promise<string> {
    try {
      const salt = await bcrypt.genSalt(this.saltRounds);
      return await bcrypt.hash(password, salt);
    } catch (error) {
      console.log(error);
      throw new Error('Unable to hash password');
    }
  }

  async comparePassword(
    plainPassword: string,
    hasdPassword: string,
  ): Promise<boolean> {
    try {
      return bcrypt.compare(plainPassword, hasdPassword);
    } catch (error) {
      console.log(error);
      throw new Error('Unable to compare passwords');
    }
  }
}
