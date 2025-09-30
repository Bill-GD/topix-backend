import { IsPositiveNumber } from '@/common/decorators';
import { CreatePostDto } from '@/modules/post/dto/create-post.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class CreateGroupPostDto extends CreatePostDto {
  @ApiPropertyOptional()
  @IsPositiveNumber()
  @IsOptional()
  tagId?: number;

  @ApiProperty()
  @IsBoolean()
  accepted: boolean;
}
