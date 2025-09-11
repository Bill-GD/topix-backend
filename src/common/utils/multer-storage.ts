import { getDistPath } from '@/common/utils/helpers';
import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';

export function createFileStorage() {
  return diskStorage({
    destination: getDistPath(),
    filename: (req, file, callback) => {
      const isImage = file.mimetype.includes('image/');
      const isVideo = file.mimetype.includes('video/');

      // 1.5 MB image
      if (isImage && file.size > 1572864) {
        return callback(new BadRequestException('Image too large.'), '');
      }
      // 256 MB video
      if (isVideo && file.size > 268435456) {
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
