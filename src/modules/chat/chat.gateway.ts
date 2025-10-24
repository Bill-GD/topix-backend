import { WsRequesterID } from '@/common/decorators';
import { WebSocketFilter } from '@/common/filters';
import { WsAuthenticatedGuard } from '@/common/guards';
import { getChatChannelId } from '@/common/utils/helpers';
import { ChatChannelDto } from '@/modules/chat/dto/chat-channel.dto';
import { ChatMessageDto } from '@/modules/chat/dto/chat-message.dto';
import { RemoveMessageDto } from '@/modules/chat/dto/remove-message.dto';
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
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: ChatChannelDto,
  ) {
    const roomId = getChatChannelId(dto.channelId);
    await client.join(roomId);
    return `Joined chat channel ${roomId}`;
  }

  @SubscribeMessage('seen')
  async markSeen(
    @WsRequesterID() requesterId: number,
    @MessageBody() dto: ChatChannelDto,
  ) {
    await this.chatService.updateLastSeen(dto.channelId, requesterId);
    return 'Seen';
  }

  @SubscribeMessage('send')
  async send(
    @WsRequesterID() requesterId: number,
    @MessageBody() dto: ChatMessageDto,
  ) {
    const res = await this.chatService.addMessage(dto, requesterId);
    this.server.to(getChatChannelId(dto.channelId)).emit('send', res.data);
    return 1;
  }

  @SubscribeMessage('remove')
  async removeMessage(@MessageBody() dto: RemoveMessageDto) {
    await this.chatService.remove(dto.messageId);
    this.server
      .to(getChatChannelId(dto.channelId))
      .emit('remove', dto.messageId);
  }
}
