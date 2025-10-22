import { IsOptionalString } from '@/common/decorators';
import { CommonQuery } from '@/common/queries/common.query';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UserQuery extends CommonQuery {
  @ApiPropertyOptional()
  @IsOptionalString()
  name?: string;
}
