import { ImageSizeLimit, VideoSizeLimit } from '@/common/utils/constants';
import { getReadableSize } from '@/common/utils/helpers';
import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

@Injectable()
export class FileSizeValidatorPipe implements PipeTransform {
  transform(files: Array<Express.Multer.File>, metadata: ArgumentMetadata) {
    for (const file of files) {
      const isImage = file.mimetype.includes('image/');
      const isVideo = file.mimetype.includes('video/');

      if (isImage && file.size > ImageSizeLimit) {
        throw new BadRequestException(
          `Image size within ${getReadableSize(ImageSizeLimit)}, got ${getReadableSize(file.size)}.`,
        );
      }
      if (isVideo && file.size > VideoSizeLimit) {
        throw new BadRequestException(
          `Video size within ${getReadableSize(VideoSizeLimit)}, got ${getReadableSize(file.size)}.`,
        );
      }
    }
    return true;
  }
}
