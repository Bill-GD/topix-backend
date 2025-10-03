import { IsNotEmptyString, IsPositiveNumber } from '@/common/decorators';
import { MediaTypes } from '@/common/utils/types';
import {
  ApiHideProperty,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
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
  threadId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsPositiveNumber()
  groupId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsPositiveNumber()
  tagId?: number;

  @ApiPropertyOptional()
  @Type(() => String)
  @Transform(({ value }) => {
    const strVal = (value as string).toLowerCase();
    return {
      true: true,
      false: false,
      undefined: undefined,
    }[strVal];
  })
  @IsBoolean()
  @IsOptional()
  approved?: boolean;
}
