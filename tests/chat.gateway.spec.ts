import { Test, TestingModule } from '@nestjs/testing';
import { ChatGateway } from '@/modules/chat/chat.gateway';
import { ChatService } from '@/modules/chat/chat.service';

describe('ChatGateway', () => {
  let gateway: ChatGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChatGateway, ChatService],
    }).compile();

    gateway = module.get<ChatGateway>(ChatGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
