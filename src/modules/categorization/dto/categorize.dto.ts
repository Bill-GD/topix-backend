import { IsOptionalString } from '@/common/decorators';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray } from 'class-validator';

export class CategorizeDto {
  @ApiProperty()
  @IsOptionalString()
  text: string = '';

  @ApiPropertyOptional()
  @IsArray()
  fileUrls: string[] = [];
}
