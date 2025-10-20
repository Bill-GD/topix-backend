import { IsOptionalString, IsPositiveNumber } from '@/common/decorators';
import { CommonQuery } from '@/common/queries/common.query';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class PostQuery extends CommonQuery {
  @ApiPropertyOptional()
  @IsOptionalString()
  username?: string;

  @ApiPropertyOptional()
  @IsPositiveNumber()
  @IsOptional()
  userId?: number;

  @ApiPropertyOptional()
  @Type(() => String)
  @Transform(({ value }) => {
    const strVal = (value as string).toLowerCase();
    if (strVal === 'null') return null;
    return Number(value);
  })
  @IsPositiveNumber()
  @IsOptional()
  parentId?: number | null;

  @ApiPropertyOptional()
  @Type(() => String)
  @Transform(({ value }) => {
    const strVal = (value as string).toLowerCase();
    if (strVal === 'null') return null;
    return Number(value);
  })
  @IsPositiveNumber()
  @IsOptional()
  threadId?: number | null;

  @ApiPropertyOptional()
  @Type(() => String)
  @Transform(({ value }) => {
    const strVal = (value as string).toLowerCase();
    if (strVal === 'null') return null;
    return Number(value);
  })
  @IsPositiveNumber()
  @IsOptional()
  groupId?: number | null;

  @ApiPropertyOptional()
  @IsPositiveNumber()
  @IsOptional()
  tagId?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  approved?: boolean;

  @ApiPropertyOptional()
  @IsOptionalString()
  visibility: 'public' | 'private' | 'hidden' = 'public';

  @ApiPropertyOptional()
  @IsOptionalString()
  content?: string;
}
