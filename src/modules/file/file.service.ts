import { CloudinaryProviderKey } from '@/common/utils/constants';
import { Result } from '@/common/utils/result';
import { Cloudinary } from '@/common/utils/types';
import { HttpException, Inject, Injectable } from '@nestjs/common';
import { UploadApiResponse } from 'cloudinary';

@Injectable()
export class FileService {
  constructor(
    @Inject(CloudinaryProviderKey) private readonly cloudinary: Cloudinary,
  ) {}

  async upload(list: Array<Express.Multer.File>) {
    const ops = list.map((file) => this.uploadSingle(file));
    const resList = await Promise.all(ops);
    return Result.ok(
      'Files uploaded successfully.',
      resList.map((r) => r.data),
    );
  }

  remove(files: { publicId: string; type: 'image' | 'video' }[]) {
    for (const file of files) {
      this.removeSingle(file.publicId, file.type);
    }
  }

  private removeSingle(publicId: string, type: 'image' | 'video') {
    void this.cloudinary.uploader.destroy(publicId, {
      resource_type: type,
    });
  }

  private async uploadSingle(media: Express.Multer.File) {
    const parts = media.originalname.split('.');
    media.filename = `${Date.now()}.${parts.pop()}`;

    const res: UploadApiResponse = await new Promise((resolve, reject) => {
      this.cloudinary.uploader
        .upload_stream(
          {
            resource_type: media.mimetype.split('/')[0] as 'image' | 'video',
            filename_override: media.filename,
          },
          (error, uploadResult) => {
            if (error) {
              return reject(new HttpException(error.message, error.http_code));
            }
            return resolve(uploadResult!);
          },
        )
        .end(media.buffer);
    });

    return Result.ok('File uploaded successfully.', res.secure_url);
  }
}
