import { ApiProperty } from '@nestjs/swagger';

export class UploadImageDto {
  @ApiProperty({ format: 'binary' })
  image: string;
}
