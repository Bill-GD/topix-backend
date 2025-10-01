import { IsNotEmptyString, IsPositiveNumber } from '@/common/decorators';
import { MediaTypes } from '@/common/utils/types';
import {
  ApiHideProperty,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreatePostDto {
  @ApiProperty()
  @IsString()
  content: string;

  @ApiProperty({ enum: Object.keys(MediaTypes) })
  @IsNotEmptyString()
  type: keyof typeof MediaTypes;

  @ApiPropertyOptional({ format: 'binary' })
  files?: string[];

  @ApiHideProperty()
  fileObjects?: Array<Express.Multer.File>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsPositiveNumber()
  groupId?: number;

  @ApiProperty()
  @IsBoolean()
  accepted: boolean;
}
