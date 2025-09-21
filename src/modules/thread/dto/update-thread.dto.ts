import { IsNotEmptyString } from '@/common/decorators';
import { ApiProperty } from '@nestjs/swagger';
import { Max } from 'class-validator';

export class UpdateThreadDto {
  @ApiProperty()
  @IsNotEmptyString()
  @Max(255)
  title: string;
}
