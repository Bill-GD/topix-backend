import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional } from 'class-validator';

const config = {
  queryLimit: 10,
} as const;

export class CommonQuery {
  @ApiPropertyOptional({ type: 'integer', example: 1 })
  @IsInt()
  @IsOptional()
  page: number = 1;

  @ApiPropertyOptional({
    type: 'integer',
    example: config.queryLimit,
    default: config.queryLimit,
  })
  @IsInt()
  @IsOptional()
  size: number = config.queryLimit;

  get offset() {
    return (this.page - 1) * this.size;
  }

  get limit() {
    return this.size;
  }
}
