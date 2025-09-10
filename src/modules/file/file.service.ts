import { CloudinaryProviderKey } from '@/common/utils/constants';
import { Result } from '@/common/utils/result';
import { CloudinaryUploadResponse } from '@/common/utils/types';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class FileService {
  constructor(
    @Inject(CloudinaryProviderKey) private readonly cloudinary: any,
  ) {}

  async uploadImage(image: Express.Multer.File) {
    const res: CloudinaryUploadResponse = await new Promise(
      (resolve, reject) => {
        this.cloudinary.uploader
          .upload_stream(
            { resource_type: 'image', filename_override: image.filename },
            (error, uploadResult) => {
              if (error) {
                return reject(error);
              }
              return resolve(uploadResult);
            },
          )
          .end(image.buffer);
      },
    );

    return Result.ok('Uploaded successfully', {
      imageId: res.public_id,
      imageUrl: res.secure_url,
    });
  }
}
