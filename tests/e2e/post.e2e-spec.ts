import { AppModule } from '@/app.module';
import { AuthenticatedGuard, GetRequesterGuard } from '@/common/guards';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as dotenv from 'dotenv';
import * as request from 'supertest';
import { App } from 'supertest/types';

dotenv.config({ path: '.env', quiet: true });

describe('Account (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(AuthenticatedGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(GetRequesterGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

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

  it(`should return 404 if post doesn't exist`, () => {
    request(app.getHttpServer()).get('/post/0').expect(404);
    request(app.getHttpServer()).delete('/post/0').expect(404);
  });

  afterAll(async () => await app.close());
});
