import { IsNotEmptyString } from '@/common/decorators';
import { ApiProperty } from '@nestjs/swagger';
import { Max } from 'class-validator';

export class CreateThreadDto {
  @ApiProperty()
  @IsNotEmptyString()
  @Max(255)
  title: string;
}
