import { IsNotEmptyString, IsPositiveNumber } from '@/common/decorators';
import { MediaTypes } from '@/common/utils/types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreatePostDto {
  @ApiProperty()
  @IsString()
  content: string;

  @ApiProperty({ enum: Object.keys(MediaTypes) })
  @IsNotEmptyString()
  type: keyof typeof MediaTypes;

  @ApiPropertyOptional({ type: 'array' })
  @IsArray()
  @IsOptional()
  mediaPaths?: string[];

  @ApiPropertyOptional()
  @IsPositiveNumber()
  @IsOptional()
  groupId?: number;

  @ApiProperty()
  @IsBoolean()
  accepted: boolean;
}
