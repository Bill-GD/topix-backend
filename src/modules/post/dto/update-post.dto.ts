import { IsOptionalString } from '@/common/decorators';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePostDto {
  @ApiPropertyOptional()
  @IsOptionalString()
  visibility?: 'public' | 'private' | 'hidden' = 'public';
}
