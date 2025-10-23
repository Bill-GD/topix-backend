import { IsOptionalString } from '@/common/decorators';
import { CommonQuery } from '@/common/queries/common.query';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ChatQuery extends CommonQuery {
  @ApiPropertyOptional()
  @IsOptionalString()
  username?: string;
}
