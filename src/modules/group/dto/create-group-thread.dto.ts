import { IsPositiveNumber } from '@/common/decorators';
import { CreateThreadDto } from '@/modules/thread/dto/create-thread.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class CreateGroupThreadDto extends CreateThreadDto {
  @ApiPropertyOptional()
  @IsPositiveNumber()
  @IsOptional()
  tagId?: number;
}
