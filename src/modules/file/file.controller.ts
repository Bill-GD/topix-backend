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
  UploadedFiles,
  UseGuards,
} from '@nestjs/common';

@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('upload')
  @UseGuards(AuthenticatedGuard)
  @ApiFile('files', UploadFileDto)
  async uploadFiles(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({
            fileType: '(image|video)/*',
            fallbackToMimetype: true,
          }),
        ],
      }),
    )
    files: Array<Express.Multer.File>,
  ) {
    for (const file of files) {
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
    }

    const res = await this.fileService.uploadList(files);

    if (!res.success) {
      throw new BadRequestException(res.message);
    }

    return ControllerResponse.ok(res.message, res.data, HttpStatus.CREATED);
  }
}
