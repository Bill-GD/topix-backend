import { Reactions } from '@/common/utils/types';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class ReactDto {
  @ApiProperty({ enum: Reactions })
  @IsEnum(Reactions)
  reaction: keyof typeof Reactions;
}
