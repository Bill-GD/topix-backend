import { CloudinaryModule } from '@/modules/cloudinary.module';
import { CryptoModule } from '@/modules/crypto/crypto.module';
import { DatabaseModule } from '@/modules/database.module';
import { FileModule } from '@/modules/file/file.module';
import { MailerModule } from '@/modules/mailer/mailer.module';
import { CanActivate } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { Request } from 'express';
import * as process from 'node:process';

export function getGlobalModules() {
  return [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
    }),
    DatabaseModule,
    CloudinaryModule,
    MailerModule,
    FileModule,
    CryptoModule,
  ];
}

export const defaultGuardMock = {
  canActivate: jest.fn(() => true),
};

export function mockRequesterGuard(role: 'user' | 'admin'): CanActivate {
  return {
    canActivate: jest.fn((context) => {
      const req = context.switchToHttp().getRequest<Request>();
      req.userId = 1;
      req.userRole = role;
      return true;
    }),
  };
}
