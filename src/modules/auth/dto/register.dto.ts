import { IsNotEmptyString, IsOptionalString } from '@/common/decorators';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  Length,
  NotContains,
} from 'class-validator';

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
  @NotContains(' ', {
    message: (args) => 'Username must not contain spaces.',
  })
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

  @ApiHideProperty()
  @Type(() => String)
  @Transform(({ value }) => (value as string).toLowerCase() === 'true')
  @IsBoolean()
  @IsOptional()
  verified: boolean = false;

  @ApiHideProperty()
  @IsOptionalString()
  profilePictureUrl?: string;
}
