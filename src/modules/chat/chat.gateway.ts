import { WsRequesterID } from '@/common/decorators';
import { WebSocketFilter } from '@/common/filters';
import { WsAuthenticatedGuard } from '@/common/guards';
import { UseFilters, UseGuards } from '@nestjs/common';
import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { ChatService } from './chat.service';
import { CreateChatChannelDto } from './dto/create-chat-channel.dto';

@WebSocketGateway({
  namespace: 'chatws',
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
})
@UseFilters(WebSocketFilter)
@UseGuards(WsAuthenticatedGuard)
export class ChatGateway {
  @WebSocketServer() private server: Server;

  constructor(private readonly chatService: ChatService) {}

  @SubscribeMessage('send')
  send(
    @WsRequesterID() requesterId: number,
    @MessageBody() dto: CreateChatChannelDto,
  ) {
    this.server.emit('send', `custom message to ${requesterId}`);
    return this.chatService.sendChat(dto);
  }

  @SubscribeMessage('remove')
  removeMessage(@MessageBody() id: number) {
    return this.chatService.remove(id);
  }
}
