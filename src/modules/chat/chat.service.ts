import { DatabaseProviderKey } from '@/common/utils/constants';
import { DBType } from '@/common/utils/types';
import { Inject, Injectable } from '@nestjs/common';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';

@Injectable()
export class ChatService {
  constructor(@Inject(DatabaseProviderKey) private readonly db: DBType) {}

  sendChat(dto: CreateChatDto) {
    return 'This action adds a new chat';
  }

  getAll() {
    return `This action returns all chat`;
  }

  getOne(id: number) {
    return `This action returns a #${id} chat`;
  }

  update(id: number, dto: UpdateChatDto) {
    return `This action updates a #${id} chat`;
  }

  remove(id: number) {
    return `This action removes a #${id} chat`;
  }
}
