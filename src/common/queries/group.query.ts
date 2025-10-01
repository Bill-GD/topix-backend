import { IsOptionalString } from '@/common/decorators';
import { CommonQuery } from '@/common/queries/common.query';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GroupQuery extends CommonQuery {
  @ApiPropertyOptional()
  @IsOptionalString()
  username?: string;

  @ApiPropertyOptional()
  @IsOptionalString()
  name?: string;
}
