import { CloudinaryModule } from '@/modules/cloudinary.module';
import { CryptoModule } from '@/modules/crypto/crypto.module';
import { DatabaseModule } from '@/modules/database.module';
import { FileModule } from '@/modules/file/file.module';
import { MailerModule } from '@/modules/mailer/mailer.module';
import { JwtModule } from '@nestjs/jwt';
import * as process from 'node:process';

export function getGlobalModules() {
  return [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
    }),
    DatabaseModule,
    CloudinaryModule,
    MailerModule,
    FileModule,
    CryptoModule,
  ];
}
