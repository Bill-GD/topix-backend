import { IsPositiveNumber } from '@/common/decorators';
import { ApiProperty } from '@nestjs/swagger';

export class RemoveMessageDto {
  @ApiProperty()
  @IsPositiveNumber()
  channelId: number;

  @ApiProperty()
  @IsPositiveNumber()
  messageId: number;
}
