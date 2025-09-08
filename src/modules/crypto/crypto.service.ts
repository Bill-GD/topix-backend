import { Injectable } from '@nestjs/common';
import * as otp from 'otp-generator';
import * as bcrypt from 'bcryptjs';
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from 'crypto';

@Injectable()
export class CryptoService {
  private readonly password: string = process.env.JWT_SECRET!;
  private readonly salt: string = process.env.CRYPTO_SALT!;
  private readonly algo: string = 'aes-256-ctr';

  private getKey() {
    return scryptSync(this.password, this.salt, 32);
  }

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

  encrypt(value: string): string {
    const iv = randomBytes(16);
    const cipher = createCipheriv(this.algo, this.getKey(), iv);
    const encrypted = Buffer.concat([
      cipher.update(value, 'utf8'),
      cipher.final(),
    ]);

    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
  }

  decrypt(value: string): string {
    const [iv, encrypted] = value.split(':');
    const decipher = createDecipheriv(
      this.algo,
      this.getKey(),
      Buffer.from(iv, 'hex'),
    );
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encrypted, 'hex')),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }
}
