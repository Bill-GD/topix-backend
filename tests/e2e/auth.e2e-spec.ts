import { AuthModule } from '@/modules/auth/auth.module';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { NextFunction, Request, Response } from 'express';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { getGlobalModules } from './test-helper';

describe('Authentication (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AuthModule, ...getGlobalModules()],
    }).compile();

    app = moduleRef.createNestApplication();
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
