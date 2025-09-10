import { ApiFile } from '@/common/decorators';
import { ControllerResponse } from '@/common/utils/controller-response';
import { UploadImageDto } from '@/modules/file/dto/upload-image.dto';
import { FileService } from '@/modules/file/file.service';
import {
  Controller,
  FileTypeValidator,
  HttpStatus,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFile,
} from '@nestjs/common';
import { Express } from 'express';

@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('image/single')
  @ApiFile('image', UploadImageDto)
  async uploadImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({
            fileType: 'image/*',
            fallbackToMimetype: true,
          }),
          new MaxFileSizeValidator({
            message: 'Image too large',
            maxSize: 1572864, // 1.5MB
          }),
        ],
      }),
    )
    image: Express.Multer.File,
  ) {
    // optional, cloudinary returns unique name anyway
    const parts = image.originalname.split('.');
    image.filename = `${Date.now()}.${parts.pop()}`;

    const res = await this.fileService.uploadImage(image);

    return ControllerResponse.ok(
      'Image uploaded successfully',
      { path: res.data.imageUrl, id: res.data.imageId },
      HttpStatus.CREATED,
    );
  }
}
