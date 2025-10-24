import { IsPositiveNumber } from '@/common/decorators';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class MessageQuery {
  @ApiPropertyOptional({
    type: 'integer',
    example: 10,
    default: 10,
  })
  @IsPositiveNumber()
  @IsOptional()
  size: number = 10;

  @ApiProperty({
    type: 'integer',
    description: 'The timestamp in milliseconds',
  })
  @IsPositiveNumber()
  timestamp: number;
}
