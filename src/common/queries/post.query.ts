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
  @IsOptionalString()
  tag?: string;

  @ApiPropertyOptional()
  @IsPositiveNumber()
  @IsOptional()
  parentId?: number;

  @ApiPropertyOptional()
  @IsPositiveNumber()
  @IsOptional()
  threadId?: number;

  @ApiPropertyOptional()
  @IsPositiveNumber()
  @IsOptional()
  groupId?: number;

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
  accepted?: boolean;
}
