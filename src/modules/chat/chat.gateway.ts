import { WsRequesterID } from '@/common/decorators';
import { WebSocketFilter } from '@/common/filters';
import { WsAuthenticatedGuard } from '@/common/guards';
import { getChatChannelId } from '@/common/utils/helpers';
import { ChatChannelDto } from '@/modules/chat/dto/chat-channel.dto';
import { ChatMessageDto } from '@/modules/chat/dto/chat-message.dto';
import { UseFilters, UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

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

  @SubscribeMessage('join')
  async joinChatChannel(
    @WsRequesterID() requesterId: number,
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: ChatChannelDto,
  ) {
    const roomId = getChatChannelId(dto.channelId);
    await client.join(roomId);
    await this.chatService.updateLastSeen(dto.channelId, requesterId);
    return `Joined chat channel ${roomId}`;
  }

  @SubscribeMessage('send')
  async send(
    @WsRequesterID() requesterId: number,
    @MessageBody() dto: ChatMessageDto,
  ) {
    const res = await this.chatService.addMessage(dto, requesterId);
    // await this.chatService.updateLastSeen(dto.channelId, requesterId);
    this.server.to(getChatChannelId(dto.channelId)).emit('send', res.data);
    // return res.data;
    return 1;
  }

  @SubscribeMessage('remove')
  removeMessage(@MessageBody() id: number) {
    return this.chatService.remove(id);
  }
}
