import { ResponseInterceptor } from '@/common/interceptors';
import { CloudinaryModule } from '@/modules/cloudinary.module';
import { CryptoModule } from '@/modules/crypto/crypto.module';
import { DatabaseModule } from '@/modules/database.module';
import { FileModule } from '@/modules/file/file.module';
import { MailerModule } from '@/modules/mailer/mailer.module';
import { CanActivate, INestApplication } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { NextFunction, Request, Response } from 'express';
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

export function mockRequesterGuard(
  id: number,
  role: 'user' | 'admin',
): CanActivate {
  return {
    canActivate: jest.fn((context) => {
      const req = context.switchToHttp().getRequest<Request>();
      req.userId = id;
      req.userRole = role;
      return true;
    }),
  };
}

export function applyGlobalEnhancers(app: INestApplication) {
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.use((_req: Request, _res: Response, next: NextFunction) => {
    next();
  });
}
