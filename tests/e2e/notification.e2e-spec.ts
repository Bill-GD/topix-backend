import { AuthenticatedGuard, GetRequesterGuard } from '@/common/guards';
import { Result } from '@/common/utils/result';
import { EventService } from '@/modules/notification/event.service';
import { NotificationController } from '@/modules/notification/notification.controller';
import { NotificationModule } from '@/modules/notification/notification.module';
import { NotificationService } from '@/modules/notification/notification.service';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EventSource } from 'eventsource';
import * as request from 'supertest';
import { App } from 'supertest/types';
import {
  applyGlobalEnhancers,
  defaultGuardMock,
  getGlobalModules,
  mockRequesterGuard,
} from './test-helper';

describe('Notification (e2e)', () => {
  let app: INestApplication<App>;
  let notiService: NotificationService;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [NotificationModule, ...getGlobalModules()],
    })
      .overrideGuard(AuthenticatedGuard)
      .useValue(defaultGuardMock)
      .overrideGuard(GetRequesterGuard)
      .useValue(mockRequesterGuard(1, 'user'))
      .compile();

    app = moduleRef.createNestApplication();
    applyGlobalEnhancers(app);
    notiService = app.get(NotificationService);
    await app.listen(3001);
  });

  afterEach(() => jest.clearAllMocks());

  it('dependencies should be defined', () => {
    expect(notiService).toBeDefined();
    expect(app.get(NotificationController)).toBeDefined();
  });

  it(`GET '/notification' returns messages, end of list is true when list is smaller than query size`, async () => {
    const getAllFunc = jest
      .spyOn(notiService, 'getAll')
      .mockResolvedValue(Result.ok('Success', []));

    return request(app.getHttpServer())
      .get('/notification?size=2')
      .expect(200)
      .then((res) => {
        expect(getAllFunc).toHaveBeenCalled();
        expect(res.headers['x-end-of-list']).toBe('true');
      });
  });

  it(`GET '/notification' returns messages, end of list is false if length matches query size`, async () => {
    const getAllFunc = jest.spyOn(notiService, 'getAll').mockResolvedValue(
      Result.ok(
        'Success',
        new Array(2).fill({
          id: '1:react:1:1762059625',
          actor: {
            id: 1,
            username: 'testuser',
            displayName: 'Test user',
            profilePicture: null,
          },
          actorCount: 1,
          actionType: 'react',
          objectId: 1,
          dateCreated: Date.now(),
          postContent: null,
          threadTitle: null,
        }),
      ),
    );

    return request(app.getHttpServer())
      .get(`/notification?size=2`)
      .expect(200)
      .then((res) => {
        expect(getAllFunc).toHaveBeenCalledWith({ size: '2' }, 1);
        expect(res.headers['x-end-of-list']).toBe('false');
      });
  });

  it(`sse`, async () => {
    const eventService = app.get(EventService);
    const baseUrl = await app.getUrl();
    const notiSource = new EventSource(`${baseUrl}/notification/sse`);

    await new Promise<void>((resolve, reject) => {
      notiSource.onmessage = ({ data }) => {
        try {
          expect(JSON.parse(data)).toEqual({
            id: '1:react:1:1762059625',
            receiverId: 1,
            actor: {
              id: 1,
              username: 'testuser',
              displayName: 'Test user',
              profilePicture: null,
            },
            actionType: 'react',
            objectId: 1,
          });
          notiSource.close();
          resolve();
        } catch (e) {
          notiSource.close();
          reject(e as Error);
        }
      };

      notiSource.onerror = (ev: ErrorEvent) => {
        notiSource.close();
        reject(ev.error! as Error);
      };

      notiSource.onopen = () => {
        eventService.emit({
          id: '1:react:1:1762059625',
          receiverId: 1,
          actor: {
            id: 1,
            username: 'testuser',
            displayName: 'Test user',
            profilePicture: null,
          },
          actionType: 'react',
          objectId: 1,
        });
      };
    });
  });

  afterAll(async () => await app.close());
});
