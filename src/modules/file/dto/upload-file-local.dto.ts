import { ApiProperty } from '@nestjs/swagger';

export class UploadFileLocalDto {
  @ApiProperty({ format: 'binary' })
  file: string;
}
