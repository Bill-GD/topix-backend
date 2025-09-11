import { ApiController, ApiFile } from '@/common/decorators';
import { AuthenticatedGuard, GetRequesterGuard } from '@/common/guards';
import { ControllerResponse } from '@/common/utils/controller-response';
import { createFileStorage } from '@/common/utils/multer-storage';
import { UploadFileLocalDto } from '@/modules/file/dto/upload-file-local.dto';
import { FileService } from '@/modules/file/file.service';
import {
  BadRequestException,
  Controller,
  FileTypeValidator,
  HttpStatus,
  Param,
  ParseFilePipe,
  ParseIntPipe,
  Post,
  Req,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { Express, Request } from 'express';

@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('local')
  @UseGuards(AuthenticatedGuard, GetRequesterGuard)
  @ApiFile('file', UploadFileLocalDto, createFileStorage())
  async uploadFileLocal(
    @UploadedFile() file: Express.Multer.File,
    @Req() request: Request,
  ) {
    const res = await this.fileService.saveLocalImage(
      request['userId'] as number,
      file,
    );

    if (!res.success) {
      throw new BadRequestException(res.message);
    }

    return ControllerResponse.ok(
      'File uploaded successfully',
      { path: `/uploads/${file.filename}` },
      HttpStatus.CREATED,
    );
  }

  @Post('cloud')
  @UseGuards(AuthenticatedGuard)
  @ApiFile('file', UploadFileLocalDto)
  async uploadFileCloud(
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

    // 1.5 MB image
    if (isImage && file.size > 1572864) {
      new BadRequestException('Image too large.');
    }
    // 256 MB video
    if (isVideo && file.size > 268435456) {
      new BadRequestException('Video too large.');
    }

    const res = await this.fileService.uploadSingleDirect(file);

    if (!res.success) {
      throw new BadRequestException(res.message);
    }

    return ControllerResponse.ok(
      'File uploaded successfully',
      { path: res.data.mediaUrl, id: res.data.mediaId },
      HttpStatus.CREATED,
    );
  }

  @Post('temp/:id/upload')
  @UseGuards(AuthenticatedGuard)
  @ApiController()
  async uploadImage(@Param('id', ParseIntPipe) mediaId: number) {
    const res = await this.fileService.uploadSingleFromTemp(mediaId);

    return ControllerResponse.ok(
      'Image uploaded successfully',
      { path: res.data.mediaUrl, id: res.data.mediaId },
      HttpStatus.CREATED,
    );
  }
}
