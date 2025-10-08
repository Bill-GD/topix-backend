import {
  IsNotEmptyString,
  IsOptionalString,
  IsPositiveNumber,
} from '@/common/decorators';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, Length } from 'class-validator';

export class CreateThreadDto {
  @ApiProperty()
  @IsNotEmptyString()
  @Length(1, 255)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsPositiveNumber()
  groupId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsPositiveNumber()
  tagId?: number;

  @ApiPropertyOptional()
  @IsOptionalString()
  visibility?: 'public' | 'private' | 'hidden' = 'public';
}
