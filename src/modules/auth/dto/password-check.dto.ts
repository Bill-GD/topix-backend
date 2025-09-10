import { IsNotEmptyString } from '@/common/decorators';
import { ApiProperty } from '@nestjs/swagger';

export class PasswordCheckDto {
  @ApiProperty({ example: 'password123' })
  @IsNotEmptyString()
  password: string;
}
