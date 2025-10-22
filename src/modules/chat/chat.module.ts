import { ChatController } from '@/modules/chat/chat.controller';
import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';

@Module({
  providers: [ChatGateway, ChatService],
  controllers: [ChatController],
})
export class ChatModule {}
