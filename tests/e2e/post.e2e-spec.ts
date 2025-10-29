import { PostModule } from '@/modules/post/post.module';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { NextFunction, Request, Response } from 'express';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { getGlobalModules } from './test-helper';

describe('Account (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PostModule, ...getGlobalModules()],
    })
      // .overrideGuard(AuthenticatedGuard)
      // .useValue({ canActivate: jest.fn(() => true) })
      // .overrideGuard(GetRequesterGuard)
      // .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    app = moduleFixture.createNestApplication();
    app.use((req: Request, res: Response, next: NextFunction) => {
      next();
    });

    await app.init();
  });

  it(`should return 404 if post doesn't exist`, () => {
    request(app.getHttpServer()).get('/post/0').expect(404);
    request(app.getHttpServer()).delete('/post/0').expect(404);
  });

  afterAll(async () => await app.close());
});
