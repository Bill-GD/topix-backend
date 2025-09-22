import { IsNotEmptyString } from '@/common/decorators';
import { ApiProperty } from '@nestjs/swagger';
import { Length } from 'class-validator';

export class CreateThreadDto {
  @ApiProperty()
  @IsNotEmptyString()
  @Length(1, 255)
  title: string;
}
