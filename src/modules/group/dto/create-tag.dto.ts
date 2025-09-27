import { IsNotEmptyString } from '@/common/decorators';
import { ApiProperty } from '@nestjs/swagger';
import { Length } from 'class-validator';

export class CreateTagDto {
  @ApiProperty()
  @IsNotEmptyString()
  @Length(1, 20)
  name: string;

  @ApiProperty()
  @IsNotEmptyString()
  @Length(6, 6)
  color: string;
}
