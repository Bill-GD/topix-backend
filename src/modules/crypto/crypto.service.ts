import { Injectable } from '@nestjs/common';
import * as otp from 'otp-generator';

@Injectable()
export class CryptoService {
  generateOTP(): string {
    return otp.generate(8, {
      specialChars: false,
      upperCaseAlphabets: false,
    });
  }
}
