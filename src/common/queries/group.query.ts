import { IsOptionalString, IsPositiveNumber } from '@/common/decorators';
import { CommonQuery } from '@/common/queries/common.query';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class GroupQuery extends CommonQuery {
  @ApiPropertyOptional()
  @IsPositiveNumber()
  @IsOptional()
  userId?: number;

  @ApiPropertyOptional()
  @IsOptionalString()
  name?: string;

  @ApiPropertyOptional()
  @Type(() => String)
  @Transform(({ value }) => {
    const strVal = (value as string).toLowerCase();
    return {
      true: true,
      false: false,
      undefined: false,
    }[strVal];
  })
  @IsBoolean()
  @IsOptional()
  hidden: boolean;
}
