import { Injectable } from '@nestjs/common';
import * as otp from 'otp-generator';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class CryptoService {
  generateOTP(): string {
    return otp.generate(8, {
      specialChars: false,
      upperCaseAlphabets: false,
    });
  }

  hashPassword(raw: string): string {
    return bcrypt.hashSync(raw, 10);
  }

  verifyPassword(raw: string, hashed: string): boolean {
    return bcrypt.compareSync(raw, hashed);
  }
}
