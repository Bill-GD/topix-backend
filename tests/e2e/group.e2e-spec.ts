import {
  AuthenticatedGuard,
  GetRequesterGuard,
  ResourceExistGuard,
  ResourceOwnerGuard,
} from '@/common/guards';
import { Result } from '@/common/utils/result';
import { GroupController } from '@/modules/group/group.controller';
import { GroupModule } from '@/modules/group/group.module';
import { GroupService } from '@/modules/group/group.service';
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

describe('Group (e2e)', () => {
  let app: INestApplication<App>;
  let groupService: GroupService;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [GroupModule, ...getGlobalModules()],
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
    groupService = app.get(GroupService);
    await app.init();
  });

  afterEach(() => jest.clearAllMocks());

  it('dependencies should be defined', () => {
    expect(groupService).toBeDefined();
    expect(app.get(GroupController)).toBeDefined();
  });

  it(`GET '/group' returns group list with pagination header`, async () => {
    const getAllFunc = jest
      .spyOn(groupService, 'getAll')
      .mockResolvedValue(Result.ok('Success', []));

    return request(app.getHttpServer())
      .get('/group')
      .expect(200)
      .then((res) => {
        expect(getAllFunc).toHaveBeenCalledWith({}, 1);
        expect(res.headers['x-end-of-list']).toBeDefined();
      });
  });

  it(`POST '/group' returns 201 if successful`, () => {
    const createFunc = jest
      .spyOn(groupService, 'create')
      .mockResolvedValue(Result.ok('Success', 1));

    return request(app.getHttpServer())
      .post('/group')
      .send({ name: 'group name' })
      .expect(201)
      .then(() => {
        expect(createFunc).toHaveBeenCalledWith({ name: 'group name' }, 1);
      });
  });

  it(`GET '/group/members' returns group member list with pagination header`, async () => {
    mockDB.$count.mockResolvedValue(1);
    const getAllFunc = jest
      .spyOn(groupService, 'getAllMembers')
      .mockResolvedValue(Result.ok('Success', []));

    return request(app.getHttpServer())
      .get('/group/0/members')
      .expect(200)
      .then((res) => {
        expect(getAllFunc).toHaveBeenCalledWith(0, {});
        expect(res.headers['x-end-of-list']).toBeDefined();
      });
  });

  it(`POST '/group/:id/post' returns 201 when adding post to group successfully`, () => {
    mockDB.$count.mockResolvedValue(1);

    const addPostFunc = jest
      .spyOn(groupService, 'addPost')
      .mockResolvedValue(Result.ok('Success', null));

    return request(app.getHttpServer())
      .post('/group/0/post')
      .send({ content: 'post content' })
      .expect(201)
      .then(() => {
        expect(addPostFunc).toHaveBeenCalled();
      });
  });

  it(`POST '/group/:id/thread' returns 201 when adding thread to group successfully`, () => {
    mockDB.$count.mockResolvedValue(1);

    const addThreadFunc = jest
      .spyOn(groupService, 'addThread')
      .mockResolvedValue(Result.ok('Success', null));

    return request(app.getHttpServer())
      .post('/group/0/thread')
      .send({ title: 'thread title' })
      .expect(201)
      .then(() => {
        expect(addThreadFunc).toHaveBeenCalled();
      });
  });

  it(`POST '/group/:id/tag' returns 201 when adding tag to group successfully`, () => {
    mockDB.$count.mockResolvedValue(1);
    mockDB.where.mockResolvedValue([{ id: 1 }]);

    const addTagFunc = jest
      .spyOn(groupService, 'addTag')
      .mockResolvedValue(Result.ok('Success', null));

    return request(app.getHttpServer())
      .post('/group/0/tag')
      .send({ name: 'test tag', color: 'ffffff' })
      .expect(201)
      .then(() => {
        expect(addTagFunc).toHaveBeenCalled();
      });
  });

  it(`group fetching routes return 404 if group doesn't exist`, () => {
    mockDB.$count.mockResolvedValue(0);
    request(app.getHttpServer()).get('/group/0').expect(404);
    request(app.getHttpServer()).get('/group/0/tags').expect(404);
    request(app.getHttpServer()).get('/group/0/members').expect(404);
    request(app.getHttpServer()).post('/group/0/join').expect(404);
    request(app.getHttpServer()).post('/group/0/post').expect(404);
    request(app.getHttpServer()).post('/group/0/thread').expect(404);
    request(app.getHttpServer()).post('/group/0/tag').expect(404);
    request(app.getHttpServer()).post('/group/0/change-owner').expect(404);
    request(app.getHttpServer()).patch('/group/0').expect(404);
    request(app.getHttpServer()).delete('/group/0/member').expect(404);
    request(app.getHttpServer()).delete('/group/0').expect(404);
  });

  it(`group administration routes return 403 if user isn't the group owner`, () => {
    mockDB.$count.mockResolvedValue(1);
    mockDB.where.mockResolvedValue([{ id: 2 }]);

    request(app.getHttpServer()).post('/group/0/tag').expect(403);
    request(app.getHttpServer()).post('/group/0/change-owner').expect(403);
    request(app.getHttpServer()).post('/group/0/member/0').expect(403);
    request(app.getHttpServer()).post('/group/0/post/0').expect(403);
    request(app.getHttpServer()).patch('/group/0').expect(403);
    request(app.getHttpServer()).delete('/group/0/member/0').expect(403);
    request(app.getHttpServer()).delete('/group/0/tag/0').expect(403);
    request(app.getHttpServer()).delete('/group/0').expect(403);
  });

  afterAll(async () => await app.close());
});
