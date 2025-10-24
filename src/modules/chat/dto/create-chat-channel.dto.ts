import { IsPositiveNumber } from '@/common/decorators';
import { ApiProperty } from '@nestjs/swagger';

export class CreateChatChannelDto {
  @ApiProperty()
  @IsPositiveNumber()
  targetId: number;
}
