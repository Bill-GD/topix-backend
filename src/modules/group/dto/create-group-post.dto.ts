import { IsPositiveNumber } from '@/common/decorators';
import { CreatePostDto } from '@/modules/post/dto/create-post.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class CreateGroupPostDto extends CreatePostDto {
  @ApiPropertyOptional()
  @IsPositiveNumber()
  @IsOptional()
  tagId?: number;
}
