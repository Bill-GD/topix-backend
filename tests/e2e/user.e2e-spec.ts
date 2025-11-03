import {
  AccountOwnerGuard,
  AuthenticatedGuard,
  GetRequesterGuard,
  UserExistGuard,
} from '@/common/guards';
import { Result } from '@/common/utils/result';
import { DBType } from '@/common/utils/types';
import { EventService } from '@/modules/notification/event.service';
import { NotificationService } from '@/modules/notification/notification.service';
import { UserController } from '@/modules/user/user.controller';
import { UserModule } from '@/modules/user/user.module';
import { UserService } from '@/modules/user/user.service';
import { INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { App } from 'supertest/types';
import {
  applyGlobalEnhancers,
  defaultGuardMock,
  getGlobalModules,
  mockDB,
  mockRequesterGuard,
} from './test-helper';

describe('User (e2e)', () => {
  const accountOwnerGuardMock = new AccountOwnerGuard(
    mockDB as unknown as DBType,
  );

  describe('normal user', () => {
    let app: INestApplication<App>;
    let userService: UserService;
    let notiService: NotificationService;
    let eventService: EventService;
    const userExistGuardMock = new UserExistGuard(
      mockDB as unknown as DBType,
      new Reflector(),
    );

    beforeAll(async () => {
      const moduleRef: TestingModule = await Test.createTestingModule({
        imports: [UserModule, ...getGlobalModules()],
      })
        .overrideGuard(AuthenticatedGuard)
        .useValue(defaultGuardMock)
        .overrideGuard(GetRequesterGuard)
        .useValue(mockRequesterGuard(1, 'user'))
        .overrideGuard(UserExistGuard)
        .useValue(userExistGuardMock)
        .overrideGuard(AccountOwnerGuard)
        .useValue(accountOwnerGuardMock)
        .compile();

      app = moduleRef.createNestApplication();
      applyGlobalEnhancers(app);

      userService = app.get(UserService);
      notiService = app.get(NotificationService);
      eventService = app.get(EventService);
      await app.init();
    });

    afterEach(() => jest.clearAllMocks());

    it('dependencies should be defined', () => {
      expect(userService).toBeDefined();
      expect(notiService).toBeDefined();
      expect(eventService).toBeDefined();
      expect(app.get(UserController)).toBeDefined();
    });

    it(`GET '/user' returns 403 for normal users`, () => {
      const getUsersFunc = jest
        .spyOn(userService, 'getUsers')
        .mockResolvedValue(Result.ok('Success', []));

      return request(app.getHttpServer())
        .get('/user')
        .expect(403)
        .then(() => {
          expect(getUsersFunc).not.toHaveBeenCalled();
        });
    });

    it(`GET '/user/me' runs normally`, () => {
      const getMeFunc = jest
        .spyOn(userService, 'getUserById')
        .mockResolvedValue({
          id: 1,
          username: 'testusername',
          displayName: 'test user',
          profilePicture: null,
          role: 'user',
        });

      return request(app.getHttpServer())
        .get('/user/me')
        .expect(200)
        .then(() => {
          expect(getMeFunc).toHaveBeenCalledWith(1);
        });
    });

    it(`PATCH 'user/me' returns 409 if fail to update to taken username`, () => {
      const updateFunc = jest
        .spyOn(userService, 'updateProfileInfo')
        .mockResolvedValue(Result.fail('Fail'));

      return request(app.getHttpServer())
        .patch('/user/me')
        .field('username', 'takenusername')
        .expect(409)
        .then(() => {
          expect(updateFunc).toHaveBeenCalledWith(1, {
            username: 'takenusername',
          });
        });
    });

    it(`PATCH 'user/me' should update user profile correctly`, () => {
      const updateFunc = jest
        .spyOn(userService, 'updateProfileInfo')
        .mockResolvedValue(Result.ok('Success', null));

      return request(app.getHttpServer())
        .patch('/user/me')
        .field('username', 'newusername')
        .expect(200)
        .then(() => {
          expect(updateFunc).toHaveBeenCalledWith(1, {
            username: 'newusername',
          });
        });
    });

    it(`GET '/user/username' returns 200 if user was found`, () => {
      mockDB.$count.mockResolvedValue(1);
      const getByUsernameFunc = jest
        .spyOn(userService, 'getUserByUsername')
        .mockResolvedValue({
          id: 1,
          username: 'testusername',
          displayName: 'test user',
          profilePicture: null,
          role: 'user',
          description: null,
          followerCount: 0,
          followingCount: 0,
          followed: true,
          chatChannelId: 1,
        });

      return request(app.getHttpServer())
        .get('/user/realusername')
        .expect(200)
        .then(() => {
          expect(getByUsernameFunc).toHaveBeenCalledWith('realusername', 1);
        });
    });

    it(`GET '/user/username' returns 404 if user wasn't found`, () => {
      mockDB.$count.mockResolvedValue(0);
      const getByUsernameFunc = jest
        .spyOn(userService, 'getUserByUsername')
        .mockResolvedValue({
          id: 1,
          username: 'testusername',
          displayName: 'test user',
          profilePicture: null,
          role: 'user',
          description: null,
          followerCount: 0,
          followingCount: 0,
          followed: true,
          chatChannelId: 1,
        });

      return request(app.getHttpServer())
        .get('/user/fakeusername')
        .expect(404)
        .then(() => {
          expect(getByUsernameFunc).not.toHaveBeenCalled();
        });
    });

    it(`POST '/user/:id/follow' returns 200 and sent notification`, () => {
      mockDB.$count.mockResolvedValue(1);
      const followFunc = jest
        .spyOn(userService, 'followUser')
        .mockResolvedValue(Result.ok('Success', null));
      const createNotiFunc = jest
        .spyOn(notiService, 'create')
        .mockResolvedValue();
      const emitNotiFunc = jest
        .spyOn(notiService, 'emitNotification')
        .mockResolvedValue();

      return request(app.getHttpServer())
        .post('/user/2/follow')
        .expect(200)
        .then(() => {
          expect(followFunc).toHaveBeenCalledWith(2, 1);
          expect(createNotiFunc).toHaveBeenCalled();
          expect(emitNotiFunc).toHaveBeenCalled();
        });
    });

    it(`DELETE '/user/:id/follow' returns 200`, () => {
      mockDB.$count.mockResolvedValue(1);
      const unfollowFunc = jest
        .spyOn(userService, 'unfollowUser')
        .mockResolvedValue(Result.ok('Success', null));

      return request(app.getHttpServer())
        .delete('/user/2/follow')
        .expect(200)
        .then(() => {
          expect(unfollowFunc).toHaveBeenCalledWith(2, 1);
        });
    });

    it(`user can't delete other user account`, () => {
      mockDB.$count.mockResolvedValue(1);
      const deleteFunc = jest
        .spyOn(userService, 'deleteUser')
        .mockResolvedValue(Result.fail('Fail'));
      mockDB.where.mockResolvedValue([{ id: 2 }]);

      return request(app.getHttpServer())
        .delete('/user/testuser')
        .expect(403)
        .then(() => {
          expect(deleteFunc).not.toHaveBeenCalled();
        });
    });

    afterAll(async () => await app.close());
  });

  describe('user is an admin', () => {
    let app: INestApplication<App>;
    let userService: UserService;

    beforeAll(async () => {
      const moduleRef: TestingModule = await Test.createTestingModule({
        imports: [UserModule, ...getGlobalModules()],
      })
        .overrideGuard(AuthenticatedGuard)
        .useValue(defaultGuardMock)
        .overrideGuard(GetRequesterGuard)
        .useValue(mockRequesterGuard(1, 'admin'))
        .overrideGuard(UserExistGuard)
        .useValue(defaultGuardMock)
        .overrideGuard(AccountOwnerGuard)
        .useValue(accountOwnerGuardMock)
        .compile();

      app = moduleRef.createNestApplication();
      applyGlobalEnhancers(app);

      userService = app.get(UserService);
      await app.init();
    });

    afterEach(() => jest.clearAllMocks());

    it('dependencies should be defined', () => {
      expect(userService).toBeDefined();
      expect(app.get(UserController)).toBeDefined();
    });

    it(`GET '/user' returns user list for admins with pagination header`, () => {
      const getUsersFunc = jest
        .spyOn(userService, 'getUsers')
        .mockResolvedValue(Result.ok('Success', []));

      return request(app.getHttpServer())
        .get('/user')
        .expect(200)
        .then((res) => {
          expect(getUsersFunc).toHaveBeenCalled();
          expect(res.headers['x-end-of-list']).toBeDefined();
        });
    });

    it(`admin can delete users`, () => {
      const deleteFunc = jest
        .spyOn(userService, 'deleteUser')
        .mockResolvedValue(Result.ok('Success', null));

      return request(app.getHttpServer())
        .delete('/user/testuser')
        .expect(200)
        .then(() => {
          expect(deleteFunc).toHaveBeenCalledWith('testuser');
        });
    });

    afterAll(async () => await app.close());
  });
});
