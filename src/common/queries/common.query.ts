import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional } from 'class-validator';

const config = {
  queryLimit: 10,
} as const;

export class CommonQuery {
  @ApiPropertyOptional({ type: 'integer', example: 1 })
  @IsInt()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({
    type: 'integer',
    example: config.queryLimit,
    default: config.queryLimit,
  })
  @IsInt()
  @IsOptional()
  size?: number;

  get offset() {
    return this.page && this.size ? (this.page - 1) * this.size : 0;
  }

  get limit() {
    return this.size || config.queryLimit;
  }
}
