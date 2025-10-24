import { IsPositiveNumber } from '@/common/decorators';
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ChatMessageDto {
  @ApiProperty()
  @IsPositiveNumber()
  channelId: number;

  @ApiProperty()
  @IsString()
  content: string;
}
