import { IsOptionalString } from '@/common/decorators';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    example: 'user123',
    description: 'The unique handle of an user.',
  })
  @IsOptionalString()
  username?: string;

  @ApiPropertyOptional({
    example: 'User 123',
    description: 'The display name of an user.',
  })
  @IsOptionalString()
  displayName?: string;

  @ApiPropertyOptional()
  @IsOptionalString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptionalString()
  profilePicture?: string;
}
