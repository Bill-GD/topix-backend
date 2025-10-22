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
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';

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
    @MessageBody() dto: CreateChatDto,
  ) {
    this.server.emit('send', `custom message to ${requesterId}`);
    return this.chatService.sendChat(dto);
  }

  @SubscribeMessage('getAllChat')
  getAll() {
    return this.chatService.getAll();
  }

  @SubscribeMessage('getOneChat')
  getOne(@MessageBody() id: number) {
    return this.chatService.getOne(id);
  }

  @SubscribeMessage('updateChat')
  update(@MessageBody() dto: UpdateChatDto) {
    return this.chatService.update(dto.id, dto);
  }

  @SubscribeMessage('removeChat')
  remove(@MessageBody() id: number) {
    return this.chatService.remove(id);
  }
}
