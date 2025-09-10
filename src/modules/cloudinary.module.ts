import { CloudinaryProviderKey } from '@/common/utils/constants';
import { Global, Module } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Global()
@Module({
  providers: [
    {
      provide: CloudinaryProviderKey,
      useValue: cloudinary,
    },
  ],
  exports: [CloudinaryProviderKey],
})
export class CloudinaryModule {}
