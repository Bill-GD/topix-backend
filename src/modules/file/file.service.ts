import { CloudinaryProviderKey } from '@/common/utils/constants';
import { Result } from '@/common/utils/result';
import { CloudinaryUploadResponse } from '@/common/utils/types';
import { HttpException, Inject, Injectable } from '@nestjs/common';

@Injectable()
export class FileService {
  constructor(
    @Inject(CloudinaryProviderKey) private readonly cloudinary: any,
  ) {}

  async uploadSingle(media: Express.Multer.File) {
    const parts = media.originalname.split('.');
    media.filename = `${Date.now()}.${parts.pop()}`;

    const res: CloudinaryUploadResponse = await new Promise(
      (resolve, reject) => {
        this.cloudinary.uploader
          .upload_stream(
            {
              resource_type: media.mimetype.split('/')[0],
              filename_override: media.filename,
            },
            (error, uploadResult) => {
              if (error)
                return reject(
                  new HttpException(error.message, error.http_code),
                );

              return resolve(uploadResult);
            },
          )
          .end(media.buffer);
      },
    );

    return Result.ok('File uploaded successfully', res.secure_url);
  }

  async uploadList(list: Array<Express.Multer.File>) {
    const ops = list.map((file) => this.uploadSingle(file));
    const resList = await Promise.all(ops);
    return Result.ok(
      'Files uploaded successfully',
      resList.map((r) => r.data),
    );
  }
}
