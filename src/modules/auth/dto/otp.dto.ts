import { IsNotEmptyString } from '@/common/decorators';
import { ApiProperty } from '@nestjs/swagger';
import { Length } from 'class-validator';

export class OtpDto {
  @ApiProperty({ example: 'a6s5d1a7' })
  @Length(8, 8)
  @IsNotEmptyString()
  otp: string;
}
