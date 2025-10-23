import { IsPositiveNumber } from '@/common/decorators';
import { ApiProperty } from '@nestjs/swagger';

export class ChatChannelDto {
  @ApiProperty()
  @IsPositiveNumber()
  channelId: number;
}
