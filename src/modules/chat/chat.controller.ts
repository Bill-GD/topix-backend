import { ApiController, RequesterID } from '@/common/decorators';
import {
  AuthenticatedGuard,
  ChatChannelDuplicationGuard,
  GetRequesterGuard,
} from '@/common/guards';
import { ChatChannelOwnerGuard } from '@/common/guards/chat-channel-owner.guard';
import { ChatQuery, MessageQuery } from '@/common/queries';
import { ControllerResponse } from '@/common/utils/controller-response';
import { addPaginateHeader } from '@/common/utils/helpers';
import { ChatService } from '@/modules/chat/chat.service';
import { CreateChatChannelDto } from '@/modules/chat/dto/create-chat-channel.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';

@Controller('chat')
@UseGuards(AuthenticatedGuard, GetRequesterGuard)
@ApiController()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('channel')
  @UseGuards(ChatChannelDuplicationGuard)
  async createChannel(
    @RequesterID() requesterId: number,
    @Body() dto: CreateChatChannelDto,
  ) {
    const res = await this.chatService.createChannel(dto, requesterId);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.CREATED);
  }

  @Get()
  async getAll(
    @Res({ passthrough: true }) response: Response,
    @Query() query: ChatQuery,
    @RequesterID() requesterId: number,
  ) {
    const res = await this.chatService.getAll(query, requesterId);
    addPaginateHeader(response, res.data.length < query.size);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }

  @Get(':id')
  async getChannel(@Param('id', ParseIntPipe) channelId: number) {
    const res = await this.chatService.getChannel(channelId);
    if (!res.success) {
      return ControllerResponse.fail(new NotFoundException(res.message));
    }
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }

  @Get(':id/messages')
  async getMessages(
    @Res({ passthrough: true }) response: Response,
    @Query() query: MessageQuery,
    @Param('id', ParseIntPipe) channelId: number,
  ) {
    const res = await this.chatService.getMessages(channelId, query);
    addPaginateHeader(response, res.data.length < query.size);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }

  @Delete(':id')
  @UseGuards(ChatChannelOwnerGuard)
  async removeChannel(@Param('id', ParseIntPipe) groupId: number) {
    const res = await this.chatService.removeChannel(groupId);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }
}
