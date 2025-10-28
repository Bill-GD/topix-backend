import { DatabaseProviderKey } from '@/common/utils/constants';
import { Result } from '@/common/utils/result';
import { DBType, JwtUserPayload } from '@/common/utils/types';
import { otpTable, profileTable, userTable } from '@/database/schemas';
import { LoginDto } from '@/modules/auth/dto/login.dto';
import { CryptoService } from '@/modules/crypto/crypto.service';
import { MailerService } from '@/modules/mailer/mailer.service';
import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { and, eq } from 'drizzle-orm';
import { RegisterDto } from './dto/register.dto';

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
        verified: dto.verified,
      })
      .$returningId();

    if (dto.verified) {
      await this.db.insert(profileTable).values({
        userId: newId,
        displayName: dto.username,
        profilePicture: dto.profilePictureUrl,
      });
    } else {
      await this.sendOTP(newId, dto);
    }
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

    const [user] = await this.db
      .select({ username: userTable.username })
      .from(userTable)
      .where(eq(userTable.id, id));

    await this.db.insert(profileTable).values({
      userId: id,
      displayName: user.username,
    });
  }

  async login(dto: LoginDto) {
    const [user] = await this.db
      .select({
        id: userTable.id,
        password: userTable.password,
        role: userTable.role,
        verified: userTable.verified,
      })
      .from(userTable)
      .where(eq(userTable.username, dto.username))
      .limit(1);

    if (!user.verified) {
      return Result.fail('User is not verified.');
    }

    if (!this.crypto.verifyPassword(dto.password, user.password)) {
      return Result.fail('Password is incorrect.');
    }

    const payload: Omit<JwtUserPayload, 'type'> = {
      sub: user.id,
      role: user.role,
    };

    return Result.ok('Signed in successfully.', {
      accessToken: this.crypto.encrypt(
        this.jwt.sign({ ...payload, type: 'access' }, { expiresIn: '1d' }),
      ),
      refreshToken: this.crypto.encrypt(
        this.jwt.sign({ ...payload, type: 'refresh' }, { expiresIn: '2w' }),
      ),
      // in seconds
      atTime: 86400,
      rtTime: 1209600,
    });
  }

  async refresh(requesterId: number) {
    const [user] = await this.db
      .select({
        id: userTable.id,
        role: userTable.role,
      })
      .from(userTable)
      .where(eq(userTable.id, requesterId))
      .limit(1);

    const payload: Omit<JwtUserPayload, 'type'> = {
      sub: user.id,
      role: user.role,
    };

    return Result.ok('Refreshed token successfully.', {
      token: this.crypto.encrypt(
        this.jwt.sign({ ...payload, type: 'access' }, { expiresIn: '1d' }),
      ),
      time: 86400,
    });
  }

  async checkPassword(id: number, password: string): Promise<boolean> {
    const [{ password: hashed }] = await this.db
      .select({ password: userTable.password })
      .from(userTable)
      .where(eq(userTable.id, id));

    return this.crypto.verifyPassword(password, hashed);
  }
}
