import { IsPositiveNumber } from '@/common/decorators';
import { NotificationActions, NotificationTypes } from '@/common/utils/types';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class NotificationDto {
  @ApiProperty()
  @IsPositiveNumber()
  receiverId: number;

  @ApiProperty()
  @IsPositiveNumber()
  actorId: number;

  @ApiProperty()
  @IsEnum(NotificationActions)
  type: NotificationTypes;

  @ApiProperty()
  @IsPositiveNumber()
  objectId: number;
}
