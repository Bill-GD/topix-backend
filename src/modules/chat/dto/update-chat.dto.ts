import { PartialType } from '@nestjs/swagger';
import { CreateChatChannelDto } from './create-chat-channel.dto';

export class UpdateChatDto extends PartialType(CreateChatChannelDto) {
  id: number;
}
