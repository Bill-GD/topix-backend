import { ApiFile } from '@/common/decorators';
import { ControllerResponse } from '@/common/utils/controller-response';
import { UploadImageDto } from '@/modules/file/dto/upload-image.dto';
import {
  Controller,
  HttpStatus,
  ParseFilePipeBuilder,
  Post,
  UploadedFile,
} from '@nestjs/common';
import { Express } from 'express';

@Controller('file')
export class FileController {
  @Post('image/single')
  @ApiFile('image', UploadImageDto)
  uploadImage(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: 'image/*',
          fallbackToMimetype: true,
        })
        .addMaxSizeValidator({
          message: 'Image too large',
          maxSize: 10,
        })
        .build(),
    )
    image: Express.Multer.File,
  ) {
    console.log(image);
    return ControllerResponse.ok(
      'Image uploaded successfully',
      { path: '/uploads/abc.png' },
      HttpStatus.CREATED,
    );
  }
}
