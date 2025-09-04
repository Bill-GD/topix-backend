import { DatabaseProviderKey } from '@/common/utils/constants';
import { DBType } from '@/common/utils/types';
import { userTable } from '@/database/schemas';
import { CryptoService } from '@/modules/crypto/crypto.service';
import { MailerService } from '@/modules/mailer/mailer.service';
import { eq } from 'drizzle-orm';
import { RegisterDto } from './dto/register.dto';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DatabaseProviderKey) private readonly db: DBType,
    private readonly mailer: MailerService,
    private readonly crypto: CryptoService,
  ) {}

  async register(dto: RegisterDto) {
    dto.password = this.crypto.hashPassword(dto.password);

    const res = await this.db
      .insert(userTable)
      .values({
        email: dto.email,
        username: dto.username,
        password: dto.password,
      })
      .$returningId();

    console.log(res);

    this.mailer.sendMail(
      dto.username,
      dto.email,
      'Email verification',
      'email-verify',
      {
        username: dto.username,
        otp: this.crypto.generateOTP(),
      },
    );

    return res[0].id;
  }

  async usernameAvailable(username: string): Promise<boolean> {
    const res = await this.db.$count(
      userTable,
      eq(userTable.username, username),
    );
    return res < 1;
  }
}
