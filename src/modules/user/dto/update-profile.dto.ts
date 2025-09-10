import { IsOptionalString } from '@/common/decorators';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({
    example: 'user123',
    description: 'The unique handle of an user.',
  })
  @IsOptionalString()
  username?: string;

  @ApiProperty({
    example: 'User 123',
    description: 'The display name of an user.',
  })
  @IsOptionalString()
  displayName?: string;

  @ApiProperty()
  @IsOptionalString()
  description?: string;
}
