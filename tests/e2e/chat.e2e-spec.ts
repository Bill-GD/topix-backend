import {
  AuthenticatedGuard,
  ChatChannelDuplicationGuard,
  ChatChannelOwnerGuard,
  GetRequesterGuard,
  WsAuthenticatedGuard,
} from '@/common/guards';
import { Result } from '@/common/utils/result';
import { ChatController } from '@/modules/chat/chat.controller';
import { ChatGateway } from '@/modules/chat/chat.gateway';
import { ChatModule } from '@/modules/chat/chat.module';
import { ChatService } from '@/modules/chat/chat.service';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { io, Socket as ClientSocket } from 'socket.io-client';
import * as request from 'supertest';
import { App } from 'supertest/types';
import {
  applyGlobalEnhancers,
  chatChannelDuplicationMock,
  chatChannelOwnerMock,
  defaultGuardMock,
  getGlobalModules,
  mockDB,
  mockRequesterGuard,
  mockWsAuthGuard,
} from './test-helper';

describe('Chat (e2e)', () => {
  describe('controller', () => {
    let app: INestApplication<App>;
    let chatService: ChatService;

    beforeAll(async () => {
      const moduleRef: TestingModule = await Test.createTestingModule({
        imports: [ChatModule, ...getGlobalModules()],
      })
        .overrideGuard(AuthenticatedGuard)
        .useValue(defaultGuardMock)
        .overrideGuard(GetRequesterGuard)
        .useValue(mockRequesterGuard(1, 'user'))
        .overrideGuard(ChatChannelDuplicationGuard)
        .useValue(chatChannelDuplicationMock)
        .overrideGuard(ChatChannelOwnerGuard)
        .useValue(chatChannelOwnerMock)
        .compile();

      app = moduleRef.createNestApplication();
      applyGlobalEnhancers(app);
      chatService = app.get(ChatService);
      await app.init();
    });

    afterEach(() => jest.clearAllMocks());

    it('dependencies should be defined', () => {
      expect(chatService).toBeDefined();
      expect(app.get(ChatController)).toBeDefined();
    });

    it(`POST '/chat/channel' returns 201 if channel successfully created`, () => {
      const createFunc = jest
        .spyOn(chatService, 'createChannel')
        .mockResolvedValue(Result.ok('Success', 1));

      return request(app.getHttpServer())
        .post('/chat/channel')
        .send({ targetId: 2 })
        .expect(201)
        .then(() => {
          expect(createFunc).toHaveBeenCalledWith({ targetId: 2 }, 1);
        });
    });

    it(`POST '/chat/channel' returns 409 if channel already created`, () => {
      mockDB.$count.mockResolvedValue(1);
      const createFunc = jest
        .spyOn(chatService, 'createChannel')
        .mockResolvedValue(Result.ok('Success', 1));

      return request(app.getHttpServer())
        .post('/chat/channel')
        .send({ targetId: 2 })
        .expect(409)
        .then(() => {
          expect(createFunc).not.toHaveBeenCalled();
        });
    });

    it(`GET '/chat' returns channel list with pagination header`, async () => {
      const getAllFunc = jest
        .spyOn(chatService, 'getAll')
        .mockResolvedValue(Result.ok('Success', []));

      return request(app.getHttpServer())
        .get('/chat')
        .expect(200)
        .then((res) => {
          expect(getAllFunc).toHaveBeenCalledWith({}, 1);
          expect(res.headers['x-end-of-list']).toBeDefined();
        });
    });

    it(`GET '/chat/:id/messages' returns messages, end of list is true when list is smaller than query size`, async () => {
      const getMessagesFunc = jest
        .spyOn(chatService, 'getMessages')
        .mockResolvedValue(Result.ok('Success', []));

      return request(app.getHttpServer())
        .get('/chat/0/messages?size=2')
        .expect(200)
        .then((res) => {
          expect(getMessagesFunc).toHaveBeenCalled();
          expect(res.headers['x-end-of-list']).toBe('true');
        });
    });

    it(`GET '/chat/:id/messages' returns messages, end of list is false if length matches query size`, async () => {
      const getMessagesFunc = jest
        .spyOn(chatService, 'getMessages')
        .mockResolvedValue(
          Result.ok(
            'Success',
            new Array(2).fill({
              id: 1,
              sender: {
                id: null,
                username: null,
                displayName: null,
                profilePicture: null,
              },
              content: 'string',
              sentAt: Date.now(),
            }),
          ),
        );

      const timestamp = Date.now();

      return request(app.getHttpServer())
        .get(`/chat/0/messages?size=2&timestamp=${timestamp}`)
        .expect(200)
        .then((res) => {
          expect(getMessagesFunc).toHaveBeenCalledWith(0, {
            size: '2',
            timestamp: `${timestamp}`,
          });
          expect(res.headers['x-end-of-list']).toBe('false');
        });
    });

    it(`GET '/chat/:id' returns 404 if channel not found`, async () => {
      const getAllFunc = jest
        .spyOn(chatService, 'getChannel')
        .mockResolvedValue(Result.fail('Fail'));

      return request(app.getHttpServer())
        .get('/chat/0')
        .expect(404)
        .then(() => {
          expect(getAllFunc).toHaveBeenCalled();
        });
    });

    it(`user can't delete channel if they aren't part of the channel`, () => {
      mockDB.$count.mockResolvedValue(0);
      const deleteFunc = jest
        .spyOn(chatService, 'removeChannel')
        .mockResolvedValue(Result.ok('Success', null));

      return request(app.getHttpServer())
        .delete('/chat/0')
        .expect(403)
        .then(() => {
          expect(deleteFunc).not.toHaveBeenCalled();
        });
    });

    afterAll(async () => await app.close());
  });

  describe('gateway', () => {
    let app: INestApplication<App>;
    let chatService: ChatService;
    let client: ClientSocket;

    beforeAll(async () => {
      const moduleRef: TestingModule = await Test.createTestingModule({
        imports: [ChatModule, ...getGlobalModules()],
      })
        .overrideGuard(WsAuthenticatedGuard)
        .useValue(mockWsAuthGuard(1, 'user'))
        .compile();

      app = moduleRef.createNestApplication();
      applyGlobalEnhancers(app);
      chatService = app.get(ChatService);
      await app.listen(3000);

      client = io(`${await app.getUrl()}/chatws`);
    });

    afterEach(() => jest.clearAllMocks());

    it('dependencies should be defined', () => {
      expect(chatService).toBeDefined();
      expect(client).toBeDefined();
      expect(app.get(ChatGateway)).toBeDefined();
    });

    it(`'join' event should return socket room ID`, (done) => {
      client.emit('join', { channelId: 1 }, (data: string) => {
        expect(data).toContain('chatchannel:1');
        done();
      });
    });

    it(`'seen' event`, (done) => {
      const updateSeenFunc = jest
        .spyOn(chatService, 'updateLastSeen')
        .mockResolvedValue();

      client.emit('seen', { channelId: 1 }, (data: any) => {
        expect(data).toBeTruthy();
        expect(updateSeenFunc).toHaveBeenCalledWith(1, 1);
        done();
      });
    });

    it(`'send' event`, (done) => {
      const messageFunc = jest
        .spyOn(chatService, 'addMessage')
        .mockResolvedValue(
          Result.ok('Success', {
            id: 1,
            sender: {
              id: 1,
              username: 'string',
              displayName: 'string',
              profilePicture: null,
            },
            content: 'message content',
            sentAt: new Date(),
          }),
        );

      client.on('send', (data: any) => {
        try {
          expect(messageFunc).toHaveBeenCalledWith(
            { channelId: 1, content: 'message content' },
            1,
          );
          expect(data).toHaveProperty('content');
          expect((data as { content: string }).content).toBe('message content');
          done();
        } catch (e) {
          done(e);
        }
      });

      client.emit('send', { channelId: 1, content: 'message content' });
    });

    it(`'remove' event`, (done) => {
      const removeFunc = jest.spyOn(chatService, 'remove').mockResolvedValue();

      client.on('remove', (data: any) => {
        try {
          expect(removeFunc).toHaveBeenCalledWith(1);
          expect(data).toBe(1);
          done();
        } catch (e) {
          done(e);
        }
      });

      client.emit('remove', { channelId: 1, messageId: 1 });
    });

    afterAll(async () => {
      client.disconnect();
      await app.close();
    });
  });
});
