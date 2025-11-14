import {
  ChatChannelDuplicationGuard,
  ChatChannelOwnerGuard,
  ResourceExistGuard,
  ResourceOwnerGuard,
} from '@/common/guards';
import { ResponseInterceptor } from '@/common/interceptors';
import { DBType } from '@/common/utils/types';
import { CategorizationModule } from '@/modules/categorization/categorization.module';
import { CloudinaryModule } from '@/modules/cloudinary.module';
import { CryptoModule } from '@/modules/crypto/crypto.module';
import { DatabaseModule } from '@/modules/database.module';
import { FileModule } from '@/modules/file/file.module';
import { MailerModule } from '@/modules/mailer/mailer.module';
import { CanActivate, INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { NextFunction, Request, Response } from 'express';
import * as process from 'node:process';
import { Socket } from 'socket.io';

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
    CategorizationModule,
  ];
}

export const defaultGuardMock = {
  canActivate: jest.fn(() => true),
};

export const mockDB = {
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn(),
  $count: jest.fn(),
};

export const resourceExistGuardMock = new ResourceExistGuard(
  mockDB as unknown as DBType,
  new Reflector(),
);

export const resourceOwnerGuardMock = new ResourceOwnerGuard(
  mockDB as unknown as DBType,
  new Reflector(),
);

export const chatChannelDuplicationMock = new ChatChannelDuplicationGuard(
  mockDB as unknown as DBType,
);

export const chatChannelOwnerMock = new ChatChannelOwnerGuard(
  mockDB as unknown as DBType,
);

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

export function mockWsAuthGuard(
  id: number,
  role: 'user' | 'admin',
): CanActivate {
  return {
    canActivate: jest.fn((context) => {
      const client = context.switchToWs().getClient<Socket>();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      client.data.userId = id;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      client.data.userRole = role;
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
