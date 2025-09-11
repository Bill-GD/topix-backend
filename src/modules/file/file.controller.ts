import { ApiController, ApiFile } from '@/common/decorators';
import { AuthenticatedGuard, GetRequesterGuard } from '@/common/guards';
import { ControllerResponse } from '@/common/utils/controller-response';
import { createFileStorage } from '@/common/utils/multer-storage';
import { UploadFileLocalDto } from '@/modules/file/dto/upload-file-local.dto';
import { FileService } from '@/modules/file/file.service';
import {
  BadRequestException,
  Controller,
  HttpStatus,
  Param,
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

  @Post('temp/:id/upload')
  @UseGuards(AuthenticatedGuard)
  @ApiController()
  async uploadImage(@Param('id', ParseIntPipe) mediaId: number) {
    const res = await this.fileService.uploadSingle(mediaId);

    return ControllerResponse.ok(
      'Image uploaded successfully',
      { path: res.data.mediaUrl, id: res.data.mediaId },
      HttpStatus.CREATED,
    );
  }
}
