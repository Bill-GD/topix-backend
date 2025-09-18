import { AppModule } from '@/app.module';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { App } from 'supertest/types';

describe('Authentication (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    const appModule = app.get(AppModule);
    appModule.configure = function (consumer) {
      consumer
        .apply((req, res, next) => {
          next();
        })
        .forRoutes('*');
    };

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
