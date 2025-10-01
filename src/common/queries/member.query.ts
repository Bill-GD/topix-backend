import { CommonQuery } from '@/common/queries/common.query';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean } from 'class-validator';

export class MemberQuery extends CommonQuery {
  @ApiProperty()
  @Type(() => String)
  @Transform(({ value }) => (value as string).toLowerCase() === 'true')
  @IsBoolean()
  accepted: boolean;
}
