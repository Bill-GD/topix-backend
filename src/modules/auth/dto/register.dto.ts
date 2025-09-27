import { IsNotEmptyString } from '@/common/decorators';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, Length } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'example@gmail.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'user123',
    description: 'The unique handle of an user.',
  })
  @IsNotEmptyString()
  username: string;

  @ApiProperty({ example: 'password123' })
  @Length(8, 20, {
    message: (args) => 'Password must be within 8 and 20 characters.',
  })
  @IsNotEmptyString()
  password: string;

  @ApiProperty({
    example: 'password123',
    description: 'Must match the password.',
  })
  @IsNotEmptyString()
  confirmPassword: string;
}
