import {
  AuthenticatedGuard,
  GetRequesterGuard,
  ResourceExistGuard,
  ResourceOwnerGuard,
} from '@/common/guards';
import { Result } from '@/common/utils/result';
import { EventService } from '@/modules/notification/event.service';
import { NotificationService } from '@/modules/notification/notification.service';
import { ThreadController } from '@/modules/thread/thread.controller';
import { ThreadModule } from '@/modules/thread/thread.module';
import { ThreadService } from '@/modules/thread/thread.service';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { App } from 'supertest/types';
import {
  applyGlobalEnhancers,
  defaultGuardMock,
  getGlobalModules,
  mockDB,
  mockRequesterGuard,
  resourceExistGuardMock,
  resourceOwnerGuardMock,
} from './test-helper';

describe('Thread (e2e)', () => {
  let app: INestApplication<App>;
  let threadService: ThreadService;
  let notiService: NotificationService;
  let eventService: EventService;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [ThreadModule, ...getGlobalModules()],
    })
      .overrideGuard(AuthenticatedGuard)
      .useValue(defaultGuardMock)
      .overrideGuard(GetRequesterGuard)
      .useValue(mockRequesterGuard(1, 'user'))
      .overrideGuard(ResourceExistGuard)
      .useValue(resourceExistGuardMock)
      .overrideGuard(ResourceOwnerGuard)
      .useValue(resourceOwnerGuardMock)
      .compile();

    app = moduleRef.createNestApplication();
    applyGlobalEnhancers(app);
    threadService = app.get(ThreadService);
    notiService = app.get(NotificationService);
    eventService = app.get(EventService);
    await app.init();
  });

  afterEach(() => jest.clearAllMocks());

  it('dependencies should be defined', () => {
    expect(threadService).toBeDefined();
    expect(notiService).toBeDefined();
    expect(eventService).toBeDefined();
    expect(app.get(ThreadController)).toBeDefined();
  });

  it(`GET '/thread' returns thread list with pagination header`, async () => {
    const getAllFunc = jest
      .spyOn(threadService, 'getAll')
      .mockResolvedValue(Result.ok('Success', []));

    return request(app.getHttpServer())
      .get('/thread')
      .expect(200)
      .then((res) => {
        expect(getAllFunc).toHaveBeenCalledWith({}, 1);
        expect(res.headers['x-end-of-list']).toBeDefined();
      });
  });

  it(`POST '/thread' returns 201 if successful`, () => {
    const createFunc = jest
      .spyOn(threadService, 'create')
      .mockResolvedValue(Result.ok('Success', 1));

    return request(app.getHttpServer())
      .post('/thread')
      .send({ title: 'thread title' })
      .expect(201)
      .then(() => {
        expect(createFunc).toHaveBeenCalledWith({ title: 'thread title' }, 1);
      });
  });

  it(`user can't add post they don't own the thread`, () => {
    mockDB.$count.mockResolvedValue(1);
    mockDB.where.mockResolvedValue([{ id: 2 }]);

    const addPostFunc = jest
      .spyOn(threadService, 'addPost')
      .mockResolvedValue(Result.ok('Success', null));

    return request(app.getHttpServer())
      .post('/thread/0/post')
      .expect(403)
      .then(() => {
        expect(addPostFunc).not.toHaveBeenCalled();
      });
  });

  it(`adding post to thread successfully notifies all follower`, () => {
    mockDB.$count.mockResolvedValue(1);
    mockDB.where.mockResolvedValue([{ id: 1 }]);

    const addPostFunc = jest
      .spyOn(threadService, 'addPost')
      .mockResolvedValue(Result.ok('Success', null));
    const createNotiFunc = jest
      .spyOn(notiService, 'create')
      .mockResolvedValue();
    const emitNotiFunc = jest
      .spyOn(notiService, 'emitNotification')
      .mockResolvedValue();
    const getFollowersFunc = jest
      .spyOn(threadService, 'getFollowers')
      .mockResolvedValue(Result.ok('Success', [1]));

    return request(app.getHttpServer())
      .post('/thread/0/post')
      .send({ content: 'post content' })
      .expect(201)
      .then(() => {
        expect(addPostFunc).toHaveBeenCalled();
        expect(getFollowersFunc).toHaveBeenCalled();
        expect(createNotiFunc).toHaveBeenCalled();
        expect(emitNotiFunc).toHaveBeenCalled();
      });
  });

  it(`thread fetching routes return 404 if thread doesn't exist`, () => {
    mockDB.$count.mockResolvedValue(0);
    request(app.getHttpServer()).get('/thread/0').expect(404);
    request(app.getHttpServer()).post('/thread/0/post').expect(404);
    request(app.getHttpServer()).post('/thread/0/follow').expect(404);
    request(app.getHttpServer()).patch('/thread/0').expect(404);
    request(app.getHttpServer()).delete('/thread/0/follow').expect(404);
    request(app.getHttpServer()).delete('/thread/0').expect(404);
  });

  it(`user can't delete thread they don't own`, () => {
    mockDB.$count.mockResolvedValue(1);
    mockDB.where.mockResolvedValue([{ id: 2 }]);

    const deleteFunc = jest
      .spyOn(threadService, 'remove')
      .mockResolvedValue(Result.ok('Success', null));

    return request(app.getHttpServer())
      .delete('/thread/0')
      .expect(403)
      .then(() => {
        expect(deleteFunc).not.toHaveBeenCalled();
      });
  });

  afterAll(async () => await app.close());
});
