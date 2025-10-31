import { AuthenticatedGuard, GetRequesterGuard } from '@/common/guards';
import { ResponseInterceptor } from '@/common/interceptors';
import { UserModule } from '@/modules/user/user.module';
import { UserService } from '@/modules/user/user.service';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { NextFunction, Request, Response } from 'express';
import { App } from 'supertest/types';
import {
  defaultGuardMock,
  getGlobalModules,
  mockRequesterGuard,
} from './test-helper';

describe('User (e2e)', () => {
  let app: INestApplication<App>;
  let userService: UserService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [UserModule, ...getGlobalModules()],
    })
      .overrideGuard(AuthenticatedGuard)
      .useValue(defaultGuardMock)
      .overrideGuard(GetRequesterGuard)
      .useValue(mockRequesterGuard('user'))
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.use((req: Request, res: Response, next: NextFunction) => {
      next();
    });

    userService = app.get(UserService);
    await app.init();
  });

  it('empty test', () => {
    expect(1).toBe(1);
  });

  // it('should return 400 for wrong password', () => {
  //   return request(app.getHttpServer())
  //     .post('/auth/password-check')
  //     .send({ password: 'clearlywrongpassword' })
  //     .expect(400);
  // });
  //
  // it('return 403 when trying to send email to verified user', () => {
  //   return request(app.getHttpServer()).post('/auth/resend/1').expect(403);
  // });
  //
  // it(`should return 404 if user doesn't exist`, async () => {
  //   return request(app.getHttpServer())
  //     .get('/user/an-username_that-should_not-exist_123')
  //     .expect(404);
  // });

  afterAll(async () => await app.close());
});
