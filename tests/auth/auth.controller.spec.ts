import { UserExistGuard } from '@/common/guards';
import { LoginDto } from '@/modules/auth/dto/login.dto';
import { OtpDto } from '@/modules/auth/dto/otp.dto';
import { RegisterDto } from '@/modules/auth/dto/register.dto';
import { CryptoModule } from '@/modules/crypto/crypto.module';
import { DatabaseModule } from '@/modules/database.module';
import { MailerModule } from '@/modules/mailer/mailer.module';
import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '@/modules/auth/auth.controller';
import { AuthService } from '@/modules/auth/auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;
  const loginGuard = UserExistGuard(true, ['username']);

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
      providers: [AuthService],
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

  it('should confirm otp correctly', async () => {
    const funcCheck = jest
      .spyOn(service, 'checkOTP')
      .mockResolvedValue([true, 'Success']);
    const funcConfirm = jest.spyOn(service, 'confirmUser').mockResolvedValue();

    const res = await controller.confirmOTP(1, otpDto);

    expect(funcCheck).toHaveBeenCalledWith(otpDto.otp, 1);
    expect(funcConfirm).toHaveBeenCalledWith(1);
    expect(res.success).toBe(true);
    expect(res.data).toBe(null);
    expect(res.status).toBe(HttpStatus.OK);
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
    const func = jest.spyOn(service, 'login').mockResolvedValue();

    const res = await controller.login(loginDto);

    expect(func).toHaveBeenCalledWith(loginDto);
    expect(res.success).toBe(true);
    expect(res.data).toHaveProperty('accessToken');
    expect(res.data).toHaveProperty('refreshToken');
    expect(res.status).toBe(HttpStatus.OK);
  });

  afterEach(() => jest.clearAllMocks());
});
