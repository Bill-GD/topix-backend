import { IsNotEmptyString } from '@/common/decorators';
import {
  ApiHideProperty,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import { Length } from 'class-validator';

export class CreateGroupDto {
  @ApiProperty()
  @IsNotEmptyString()
  @Length(1, 255)
  name: string;

  @ApiPropertyOptional({ format: 'binary' })
  banner?: string;

  @ApiHideProperty()
  bannerFile?: Express.Multer.File;
}
