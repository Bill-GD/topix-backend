import {
  AuthenticatedGuard,
  GetRequesterGuard,
  ResourceExistGuard,
  ResourceOwnerGuard,
} from '@/common/guards';
import { Result } from '@/common/utils/result';
import { EventService } from '@/modules/notification/event.service';
import { NotificationService } from '@/modules/notification/notification.service';
import { PostController } from '@/modules/post/post.controller';
import { PostModule } from '@/modules/post/post.module';
import { PostService } from '@/modules/post/post.service';
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

describe('Account (e2e)', () => {
  describe('normal user', () => {
    let app: INestApplication<App>;
    let postService: PostService;
    let notiService: NotificationService;
    let eventService: EventService;

    beforeAll(async () => {
      const moduleRef: TestingModule = await Test.createTestingModule({
        imports: [PostModule, ...getGlobalModules()],
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
      postService = app.get(PostService);
      notiService = app.get(NotificationService);
      eventService = app.get(EventService);
      await app.init();
    });

    beforeEach(() => jest.clearAllMocks());

    it('dependencies should be defined', () => {
      expect(postService).toBeDefined();
      expect(notiService).toBeDefined();
      expect(eventService).toBeDefined();
      expect(app.get(PostController)).toBeDefined();
    });

    it(`POST '/post' returns 201 for successful upload`, () => {
      const uploadFunc = jest
        .spyOn(postService, 'create')
        .mockResolvedValue(Result.ok('Success', 1));

      return request(app.getHttpServer())
        .post('/post')
        .field('content', 'post content')
        .field('type', 'image')
        .expect(201)
        .then(() => {
          expect(uploadFunc).toHaveBeenCalledWith(1, {
            content: 'post content',
            type: 'image',
          });
        });
    });

    it(`POST '/post' returns 400 if images are too large`, () => {
      const uploadFunc = jest
        .spyOn(postService, 'create')
        .mockResolvedValue(Result.ok('Success', 1));

      const buffer = Buffer.alloc(1024 * 1024 * 11, '.');

      return request(app.getHttpServer())
        .post('/post')
        .field('content', 'post content')
        .field('type', 'image')
        .attach('files', buffer, {
          filename: 'testfile.png',
          contentType: 'image/png',
        })
        .expect(400)
        .then(() => {
          expect(uploadFunc).not.toHaveBeenCalled();
        });
    });

    it(`GET '/post'  & '/post/following' returns post list with pagination header`, async () => {
      const getAllFunc = jest
        .spyOn(postService, 'getAll')
        .mockResolvedValue(Result.ok('Success', []));
      const getFollowingFunc = jest
        .spyOn(postService, 'getAllFollowing')
        .mockResolvedValue(Result.ok('Success', []));

      const allRes = await request(app.getHttpServer())
        .get('/post')
        .expect(200);
      expect(getAllFunc).toHaveBeenCalledWith({}, 1);
      expect(allRes.headers['x-end-of-list']).toBeDefined();

      const followRes = await request(app.getHttpServer())
        .get('/post/following')
        .expect(200);
      expect(getFollowingFunc).toHaveBeenCalledWith({}, 1);
      expect(followRes.headers['x-end-of-list']).toBeDefined();
    });

    it(`post fetching routes return 200 if post exists`, async () => {
      mockDB.$count.mockResolvedValue(1);
      mockDB.where.mockResolvedValue([{ id: 1 }]);

      const getOneFunc = jest.spyOn(postService, 'getOne').mockResolvedValue(
        Result.ok('Success', {
          mediaPaths: [],
          id: 0,
          owner: {
            id: 1,
            username: 'user',
            displayName: 'User',
            profilePicture: null,
          },
          content: 'mock content',
          reaction: null,
          reactionCount: 0,
          replyCount: 0,
          media: '',
          parentPostId: null,
          threadId: null,
          threadTitle: null,
          threadOwnerId: null,
          threadVisibility: null,
          groupId: null,
          groupName: null,
          groupVisibility: null,
          joinedGroup: null,
          tag: null,
          groupApproved: false,
          visibility: 'public',
          dateCreated: new Date(),
          dateUpdated: null,
        }),
      );
      const replyFunc = jest
        .spyOn(postService, 'reply')
        .mockResolvedValue(Result.ok('Success', null));
      const updateFunc = jest
        .spyOn(postService, 'update')
        .mockResolvedValue(Result.ok('Success', null));
      const reactFunc = jest
        .spyOn(postService, 'updateReaction')
        .mockResolvedValue(Result.ok('Success', null));
      const deleteFunc = jest
        .spyOn(postService, 'remove')
        .mockResolvedValue(Result.ok('Success', null));
      const deleteReactionFunc = jest
        .spyOn(postService, 'removeReaction')
        .mockResolvedValue(Result.ok('Success', null));
      const createNotiFunc = jest
        .spyOn(notiService, 'create')
        .mockResolvedValue();
      const emitNotiFunc = jest
        .spyOn(notiService, 'emitNotification')
        .mockResolvedValue();

      await request(app.getHttpServer()).get('/post/0').expect(200);
      expect(getOneFunc).toHaveBeenCalled();
      await request(app.getHttpServer()).post('/post/0/reply').expect(200);
      expect(replyFunc).toHaveBeenCalled();
      await request(app.getHttpServer()).patch('/post/0').expect(200);
      expect(updateFunc).toHaveBeenCalled();
      await request(app.getHttpServer()).patch('/post/0/react').expect(200);
      expect(reactFunc).toHaveBeenCalled();
      expect(createNotiFunc).toHaveBeenCalled();
      expect(emitNotiFunc).toHaveBeenCalled();
      await request(app.getHttpServer()).delete('/post/0').expect(200);
      expect(deleteFunc).toHaveBeenCalled();
      await request(app.getHttpServer()).delete('/post/0/react').expect(200);
      expect(deleteReactionFunc).toHaveBeenCalled();
    });

    it(`post fetching routes return 404 if post doesn't exist`, () => {
      mockDB.$count.mockResolvedValue(0);
      request(app.getHttpServer()).get('/post/0').expect(404);
      request(app.getHttpServer()).post('/post/0/reply').expect(404);
      request(app.getHttpServer()).patch('/post/0').expect(404);
      request(app.getHttpServer()).patch('/post/0/react').expect(404);
      request(app.getHttpServer()).delete('/post/0').expect(404);
      request(app.getHttpServer()).delete('/post/0/react').expect(404);
    });

    it(`user can't delete post they don't own`, () => {
      mockDB.$count.mockResolvedValue(1);
      mockDB.where.mockResolvedValue([{ id: 2 }]);

      const deleteFunc = jest
        .spyOn(postService, 'remove')
        .mockResolvedValue(Result.ok('Success', null));

      return request(app.getHttpServer())
        .delete('/post/0')
        .expect(403)
        .then(() => {
          expect(deleteFunc).not.toHaveBeenCalled();
        });
    });

    afterAll(async () => await app.close());
  });

  describe('admin', () => {
    let app: INestApplication<App>;
    let postService: PostService;

    beforeAll(async () => {
      const moduleRef: TestingModule = await Test.createTestingModule({
        imports: [PostModule, ...getGlobalModules()],
      })
        .overrideGuard(AuthenticatedGuard)
        .useValue(defaultGuardMock)
        .overrideGuard(GetRequesterGuard)
        .useValue(mockRequesterGuard(1, 'admin'))
        .overrideGuard(ResourceExistGuard)
        .useValue(resourceExistGuardMock)
        .overrideGuard(ResourceOwnerGuard)
        .useValue(resourceOwnerGuardMock)
        .compile();

      app = moduleRef.createNestApplication();
      applyGlobalEnhancers(app);
      postService = app.get(PostService);
      await app.init();
    });

    beforeEach(() => jest.clearAllMocks());

    it('dependencies should be defined', () => {
      expect(postService).toBeDefined();
      expect(app.get(PostController)).toBeDefined();
    });

    it(`admin can delete post they don't own`, () => {
      mockDB.$count.mockResolvedValue(1);
      mockDB.where.mockResolvedValue([{ id: 2 }]);

      const deleteFunc = jest
        .spyOn(postService, 'remove')
        .mockResolvedValue(Result.ok('Success', null));

      return request(app.getHttpServer())
        .delete('/post/0')
        .expect(200)
        .then(() => {
          expect(deleteFunc).toHaveBeenCalled();
        });
    });

    afterAll(async () => await app.close());
  });
});
