import { ImageSizeLimit, VideoSizeLimit } from '@/common/utils/constants';
import { getDistPath } from '@/common/utils/helpers';
import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';

export function createFileStorage() {
  return diskStorage({
    destination: getDistPath(),
    filename: (req, file, callback) => {
      const isImage = file.mimetype.includes('image/');
      const isVideo = file.mimetype.includes('video/');

      if (isImage && file.size > ImageSizeLimit) {
        return callback(new BadRequestException('Image too large.'), '');
      }
      if (isVideo && file.size > VideoSizeLimit) {
        return callback(new BadRequestException('Video too large.'), '');
      }

      if (!isVideo && !isImage) {
        return callback(
          new BadRequestException(
            'The uploaded file must be an image or video.',
          ),
          '',
        );
      }

      const parts = file.originalname.split('.');
      callback(null, `${Date.now()}.${parts.pop()}`);
    },
  });
}
