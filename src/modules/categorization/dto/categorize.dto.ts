import { IsNotEmptyString } from '@/common/decorators';
import { ApiProperty } from '@nestjs/swagger';

export class CategorizeDto {
  @ApiProperty()
  @IsNotEmptyString()
  text: string;
}
