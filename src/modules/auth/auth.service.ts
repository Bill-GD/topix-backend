import { DatabaseProviderKey } from '@/common/utils/constants';
import { Result } from '@/common/utils/result';
import { DBType, JwtUserPayload } from '@/common/utils/types';
import { otpTable, userTable } from '@/database/schemas';
import { LoginDto } from '@/modules/auth/dto/login.dto';
import { CryptoService } from '@/modules/crypto/crypto.service';
import { MailerService } from '@/modules/mailer/mailer.service';
import { JwtService } from '@nestjs/jwt';
import { and, eq } from 'drizzle-orm';
import { RegisterDto } from './dto/register.dto';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DatabaseProviderKey) private readonly db: DBType,
    private readonly mailer: MailerService,
    private readonly crypto: CryptoService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<number> {
    dto.password = this.crypto.hashPassword(dto.password);

    const [{ id: newId }] = await this.db
      .insert(userTable)
      .values({
        email: dto.email,
        username: dto.username,
        password: dto.password,
      })
      .$returningId();

    await this.sendOTP(newId, dto);
    return newId;
  }

  async sendOTP(userId: number, dto?: RegisterDto): Promise<void> {
    const otp = this.crypto.generateOTP();

    await this.db.insert(otpTable).values({ userId, otp });

    let username = dto?.username ?? '',
      email = dto?.email ?? '';

    if (!dto) {
      [{ username, email }] = await this.db
        .select({
          username: userTable.username,
          email: userTable.email,
        })
        .from(userTable)
        .where(eq(userTable.id, userId))
        .limit(1);
    }

    this.mailer.sendMail(
      username,
      email,
      'Email verification',
      'email-verify',
      {
        username: username,
        otp,
      },
    );
  }

  async checkOTP(otp: string, userId: number): Promise<Result<null>> {
    const res = await this.db
      .select({
        otp: otpTable.otp,
        expiresAt: otpTable.expiresAt,
      })
      .from(otpTable)
      .where(and(eq(otpTable.userId, userId), eq(otpTable.otp, otp)))
      .limit(1);

    if (res.length <= 0) {
      return Result.fail('OTP does not match.');
    }
    if (res[0].expiresAt < new Date(Date.now())) {
      return Result.fail('OTP has expired.');
    }
    return Result.ok('OTP is correct', null);
  }

  async confirmUser(id: number): Promise<void> {
    await this.db
      .update(userTable)
      .set({ verified: true })
      .where(eq(userTable.id, id));

    await this.db.delete(otpTable).where(eq(otpTable.userId, id));
  }

  async login(dto: LoginDto) {
    const [user] = await this.db
      .select({
        id: userTable.id,
        username: userTable.username,
        email: userTable.email,
        password: userTable.password,
      })
      .from(userTable)
      .where(eq(userTable.username, dto.username))
      .limit(1);

    if (!this.crypto.verifyPassword(dto.password, user.password)) {
      return Result.fail('Password is incorrect.');
    }

    const payload: JwtUserPayload = {
      ...user,
      sub: user.id,
    };

    return Result.ok('Logged in successfully', {
      accessToken: this.jwt.sign(payload, { expiresIn: '1d' }),
      refreshToken: this.jwt.sign(payload, { expiresIn: '2w' }),
    });
  }
}
