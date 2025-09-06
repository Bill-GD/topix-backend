import { IsNotEmptyString } from '@/common/decorators';
import { ApiProperty } from '@nestjs/swagger';
import { Length } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'user123',
    description: 'The unique handle of an user.',
  })
  @IsNotEmptyString()
  username: string;

  @ApiProperty({ example: 'password123' })
  @Length(8, 20)
  @IsNotEmptyString()
  password: string;
}
