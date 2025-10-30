import { UserExistGuard, UserVerifiedGuard } from '@/common/guards';
import { ResponseInterceptor } from '@/common/interceptors';
import { Result } from '@/common/utils/result';
import { AuthModule } from '@/modules/auth/auth.module';
import { AuthService } from '@/modules/auth/auth.service';
import { OtpDto } from '@/modules/auth/dto/otp.dto';
import { ForbiddenException, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { NextFunction, Request, Response } from 'express';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { defaultGuardMock, getGlobalModules } from './test-helper';

describe('Guards', () => {
  describe('Auth guard', () => {
    let app: INestApplication<App>;

    beforeAll(async () => {
      const moduleRef: TestingModule = await Test.createTestingModule({
        imports: [AuthModule, ...getGlobalModules()],
      }).compile();

      app = moduleRef.createNestApplication();
      app.useGlobalInterceptors(new ResponseInterceptor());
      app.use((req: Request, res: Response, next: NextFunction) => {
        next();
      });
      await app.init();
    });

    it('should return 400 if no token provided', () => {
      return request(app.getHttpServer())
        .post('/auth/password-check')
        .expect(400);
    });

    it('should return 401 if token is invalid', () => {
      return request(app.getHttpServer())
        .post('/auth/password-check')
        .set('Authorization', 'Bearer notvalidtoken')
        .expect(401);
    });

    afterAll(async () => await app.close());
  });

  describe('Verified user guard', () => {
    let app: INestApplication<App>;
    let authService: AuthService;

    beforeAll(async () => {
      const moduleRef: TestingModule = await Test.createTestingModule({
        imports: [AuthModule, ...getGlobalModules()],
      })
        .overrideGuard(UserExistGuard)
        .useValue(defaultGuardMock)
        .overrideGuard(UserVerifiedGuard)
        .useValue({
          canActivate: jest.fn(() => {
            throw new ForbiddenException('Already verified');
          }),
        })
        .compile();

      app = moduleRef.createNestApplication();
      app.useGlobalInterceptors(new ResponseInterceptor());
      app.use((req: Request, res: Response, next: NextFunction) => {
        next();
      });
      authService = app.get(AuthService);
      await app.init();
    });

    it(`should return 403 if user is already verified`, () => {
      jest
        .spyOn(authService, 'checkOTP')
        .mockResolvedValue(Result.fail('Fail'));
      jest.spyOn(authService, 'confirmUser').mockResolvedValue();

      return request(app.getHttpServer())
        .post('/auth/confirm/1')
        .send({ otp: 'validotp' } as OtpDto)
        .expect(403);
    });

    afterAll(async () => await app.close());
  });
});
