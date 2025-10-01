import { IsOptionalString } from '@/common/decorators';
import { ApiHideProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

  @ApiPropertyOptional({ format: 'binary' })
  profilePicture?: string;

  @ApiHideProperty()
  profilePictureFile?: Express.Multer.File;

  @ApiPropertyOptional()
  @IsOptionalString()
  description?: string;
}
