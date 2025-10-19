import { IsOptionalString, IsPositiveNumber } from '@/common/decorators';
import { CommonQuery } from '@/common/queries/common.query';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class ThreadQuery extends CommonQuery {
  @ApiPropertyOptional()
  @IsPositiveNumber()
  @IsOptional()
  userId?: number;

  @ApiPropertyOptional()
  @IsPositiveNumber()
  @IsOptional()
  groupId?: number;

  @ApiPropertyOptional()
  @IsPositiveNumber()
  @IsOptional()
  tagId?: number;

  @ApiPropertyOptional()
  @IsOptionalString()
  visibility: 'public' | 'private' | 'hidden' = 'public';
}
