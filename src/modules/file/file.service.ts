import {
  CloudinaryProviderKey,
  DatabaseProviderKey,
} from '@/common/utils/constants';
import { getUploadsPath } from '@/common/utils/helpers';
import { Result } from '@/common/utils/result';
import { CloudinaryUploadResponse, DBType } from '@/common/utils/types';
import { mediaTempTable } from '@/database/schemas';
import { HttpException, Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import * as fs from 'node:fs';

@Injectable()
export class FileService {
  constructor(
    @Inject(CloudinaryProviderKey) private readonly cloudinary: any,
    @Inject(DatabaseProviderKey) private readonly db: DBType,
  ) {}

  async getTempMediaById(id: number) {
    const [res] = await this.db
      .select({
        type: mediaTempTable.type,
        filename: mediaTempTable.path,
      })
      .from(mediaTempTable)
      .where(eq(mediaTempTable.id, id));
    return res;
  }

  async uploadSingleFromTemp(id: number) {
    const media = await this.getTempMediaById(id);

    const res: CloudinaryUploadResponse = await new Promise(
      (resolve, reject) => {
        this.cloudinary.uploader
          .upload_stream(
            { resource_type: media.type, filename_override: media.filename },
            (error, uploadResult) => {
              if (error)
                return reject(
                  new HttpException(error.message, error.http_code),
                );

              return resolve(uploadResult);
            },
          )
          .end(fs.readFileSync(getUploadsPath(media.filename)));
      },
    );

    await this.db.delete(mediaTempTable).where(eq(mediaTempTable.id, id));
    fs.unlinkSync(getUploadsPath(media.filename));

    return Result.ok('Uploaded successfully', {
      mediaId: res.public_id,
      mediaUrl: res.secure_url,
    });
  }

  async uploadSingleDirect(media: Express.Multer.File) {
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

    return Result.ok('Uploaded successfully', {
      mediaId: res.public_id,
      mediaUrl: res.secure_url,
    });
  }

  async saveLocalImage(userId: number, file: Express.Multer.File) {
    await this.db.insert(mediaTempTable).values({
      userId,
      type: file.mimetype.split('/')[0] as 'image' | 'video',
      path: file.filename,
    });

    return Result.ok('Uploaded successfully', null);
  }
}
