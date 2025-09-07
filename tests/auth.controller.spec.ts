import { AccountInfoGuard } from '@/common/guards';
import { Result } from '@/common/utils/result';
import { LoginDto } from '@/modules/auth/dto/login.dto';
import { OtpDto } from '@/modules/auth/dto/otp.dto';
import { RegisterDto } from '@/modules/auth/dto/register.dto';
import { CryptoModule } from '@/modules/crypto/crypto.module';
import { DatabaseModule } from '@/modules/database.module';
import { MailerModule } from '@/modules/mailer/mailer.module';
import {
  BadRequestException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '@/modules/auth/auth.controller';
import { AuthService } from '@/modules/auth/auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;
  const loginGuard = AccountInfoGuard(true, ['username']);

  const registerDto: RegisterDto = {
    email: 'test@gmail.com',
    username: 'test',
    password: 'password',
    confirmPassword: 'password',
  };
  const otpDto: OtpDto = { otp: '123456ab' };
  const loginDto: LoginDto = {
    username: 'test',
    password: 'password',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [AuthService, JwtService],
      imports: [DatabaseModule, MailerModule, CryptoModule],
    })
      .overrideGuard(loginGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get(AuthController);
    service = module.get(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(controller).toBeDefined();
  });

  it('should register correctly', async () => {
    const func = jest.spyOn(service, 'register').mockResolvedValue(1);

    const res = await controller.register(registerDto);

    expect(func).toHaveBeenCalledWith(registerDto);
    expect(res.success).toBe(true);
    expect(res.data.id).toBe(1);
    expect(res.status).toBe(HttpStatus.CREATED);
  });

  it('should throw BadRequestException if passwords do not match', async () => {
    await expect(
      controller.register({ ...registerDto, confirmPassword: 'wrong' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should confirm otp correctly', async () => {
    const funcCheck = jest
      .spyOn(service, 'checkOTP')
      .mockResolvedValue(Result.ok('Success', null));
    const funcConfirm = jest.spyOn(service, 'confirmUser').mockResolvedValue();

    const res = await controller.confirmOTP(1, otpDto);

    expect(funcCheck).toHaveBeenCalledWith(otpDto.otp, 1);
    expect(funcConfirm).toHaveBeenCalledWith(1);
    expect(res.success).toBe(true);
    expect(res.data).toBe(null);
    expect(res.status).toBe(HttpStatus.OK);
  });

  it('should throw BadRequestException if OTP check fails', async () => {
    jest.spyOn(service, 'checkOTP').mockResolvedValue(Result.fail('Fail'));

    await expect(controller.confirmOTP(0, otpDto)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should notify email resend correctly', async () => {
    const func = jest.spyOn(service, 'sendOTP').mockResolvedValue();

    const res = await controller.resendOTP(1);

    expect(func).toHaveBeenCalledWith(1);
    expect(res.success).toBe(true);
    expect(res.data).toBe(null);
    expect(res.status).toBe(HttpStatus.OK);
  });

  it('should sign user in correctly', async () => {
    const func = jest.spyOn(service, 'login').mockResolvedValue(
      Result.ok('Success', {
        accessToken: '',
        refreshToken: '',
      }),
    );

    const res = await controller.login(loginDto);

    expect(func).toHaveBeenCalledWith(loginDto);
    expect(res.success).toBe(true);
    expect(res.data).toHaveProperty('accessToken');
    expect(res.data).toHaveProperty('refreshToken');
    expect(res.status).toBe(HttpStatus.OK);
  });

  it('should throw UnauthorizedException if login fails', async () => {
    jest.spyOn(service, 'login').mockResolvedValue(Result.fail('Fail'));

    await expect(controller.login(loginDto)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  afterEach(() => jest.clearAllMocks());
});
