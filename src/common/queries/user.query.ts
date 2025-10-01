import { IsPositiveNumber } from '@/common/decorators';
import { CommonQuery } from '@/common/queries/common.query';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UserQuery extends CommonQuery {
  @ApiPropertyOptional()
  @IsPositiveNumber()
  @IsOptional()
  groupId?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  accepted?: boolean;
}
