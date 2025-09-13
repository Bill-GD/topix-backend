import { ApiFile } from '@/common/decorators';
import { AuthenticatedGuard } from '@/common/guards';
import { ImageSizeLimit, VideoSizeLimit } from '@/common/utils/constants';
import { ControllerResponse } from '@/common/utils/controller-response';
import { getReadableSize } from '@/common/utils/helpers';
import { UploadFileDto } from '@/modules/file/dto/upload-file.dto';
import { FileService } from '@/modules/file/file.service';
import {
  BadRequestException,
  Controller,
  FileTypeValidator,
  HttpStatus,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { Express } from 'express';

@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('upload')
  @UseGuards(AuthenticatedGuard)
  @ApiFile('file', UploadFileDto)
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({
            fileType: '(image|video)/*',
            fallbackToMimetype: true,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const isImage = file.mimetype.includes('image/');
    const isVideo = file.mimetype.includes('video/');

    if (isImage && file.size > ImageSizeLimit) {
      new BadRequestException(
        `Image size within ${getReadableSize(ImageSizeLimit)}, got ${getReadableSize(file.size)}.`,
      );
    }
    if (isVideo && file.size > VideoSizeLimit) {
      new BadRequestException(
        `Video size within ${getReadableSize(VideoSizeLimit)}, got ${getReadableSize(file.size)}.`,
      );
    }

    const res = await this.fileService.uploadSingle(file);

    if (!res.success) {
      throw new BadRequestException(res.message);
    }

    return ControllerResponse.ok(
      'File uploaded successfully',
      { path: res.data.mediaUrl, id: res.data.mediaId },
      HttpStatus.CREATED,
    );
  }
}
