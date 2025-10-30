import {
  AccountInfoGuard,
  AuthenticatedGuard,
  GetRequesterGuard,
  UserExistGuard,
  UserVerifiedGuard,
} from '@/common/guards';
import { ResponseInterceptor } from '@/common/interceptors';
import { Result } from '@/common/utils/result';
import { JwtUserPayload } from '@/common/utils/types';
import { AuthController } from '@/modules/auth/auth.controller';
import { AuthModule } from '@/modules/auth/auth.module';
import { AuthService } from '@/modules/auth/auth.service';
import { LoginDto } from '@/modules/auth/dto/login.dto';
import { OtpDto } from '@/modules/auth/dto/otp.dto';
import { PasswordCheckDto } from '@/modules/auth/dto/password-check.dto';
import { RegisterDto } from '@/modules/auth/dto/register.dto';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as dotenv from 'dotenv';
import { NextFunction, Request, Response } from 'express';
import * as request from 'supertest';
import { App } from 'supertest/types';
import {
  defaultGuardMock,
  getGlobalModules,
  getRequesterGuardMock,
} from './test-helper';

dotenv.config({ path: '.env', quiet: true });

describe('Authentication (e2e)', () => {
  let app: INestApplication<App>;
  let authService: AuthService;
  let jwtService: JwtService;
  let accessToken: string;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AuthModule, ...getGlobalModules()],
    })
      .overrideGuard(AuthenticatedGuard)
      .useValue(defaultGuardMock)
      .overrideGuard(GetRequesterGuard)
      .useValue(getRequesterGuardMock)
      .overrideGuard(UserVerifiedGuard)
      .useValue(defaultGuardMock)
      .overrideGuard(UserExistGuard)
      .useValue(defaultGuardMock)
      .overrideGuard(AccountInfoGuard)
      .useValue(defaultGuardMock)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.use((req: Request, res: Response, next: NextFunction) => {
      next();
    });

    authService = app.get(AuthService);
    jwtService = app.get(JwtService);
    await app.init();
  });

  beforeEach(() => {
    accessToken = jwtService.sign({
      sub: 1,
      role: 'user',
      type: 'access',
    } as JwtUserPayload);
  });

  it('controller & services should be defined', () => {
    expect(authService).toBeDefined();
    expect(jwtService).toBeDefined();
    expect(app.get(AuthController)).toBeDefined();
  });

  it(`'/auth/refresh' returns 403 if refresh token not provided when refreshing`, () => {
    return request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403);
  });

  it(`'/auth/refresh' returns refresh token with its age`, () => {
    const refreshToken = jwtService.sign({
      sub: 1,
      role: 'user',
      type: 'refresh',
    } as JwtUserPayload);
    jest
      .spyOn(authService, 'refresh')
      .mockResolvedValue(
        Result.ok('Success', { token: 'newrefreshtoken', time: 1 }),
      );

    return request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Authorization', `Bearer ${refreshToken}`)
      .expect(200)
      .then((res) => {
        expect(res.body).toHaveProperty('data.token');
        expect(res.body).toHaveProperty('data.time');
      });
  });

  it(`'/auth/password-check' returns 400 if password is wrong`, () => {
    jest.spyOn(authService, 'checkPassword').mockResolvedValue(false);

    return request(app.getHttpServer())
      .post('/auth/password-check')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ password: 'wrongpassword' } as PasswordCheckDto)
      .expect(400);
  });

  it(`'/auth/password-check' returns 200 if password is correct`, () => {
    jest.spyOn(authService, 'checkPassword').mockResolvedValue(true);

    return request(app.getHttpServer())
      .post('/auth/password-check')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ password: 'correctpassword' } as PasswordCheckDto)
      .expect(200);
  });

  it(`'/auth/register' returns 400 if passwords don't match`, () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'example@gmail.com',
        username: 'test-username',
        password: 'password',
        confirmPassword: 'wrongconfirmpassword',
      } as RegisterDto)
      .expect(400);
  });

  it(`'/auth/register' returns 400 if password too short`, () => {
    jest.spyOn(authService, 'register').mockResolvedValue(1);

    return request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'example@gmail.com',
        username: 'test-username',
        password: 'short',
        confirmPassword: 'wrongconfirmpassword',
      } as RegisterDto)
      .expect(400);
  });

  it(`'/auth/register' returns 400 if username has space`, () => {
    jest.spyOn(authService, 'register').mockResolvedValue(1);

    return request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'example@gmail.com',
        username: 'test     username',
        password: 'password',
        confirmPassword: 'wrongconfirmpassword',
      } as RegisterDto)
      .expect(400);
  });

  it(`'/auth/register' returns 201 if registered successfully`, () => {
    const registerFunc = jest
      .spyOn(authService, 'register')
      .mockResolvedValue(1);
    const registerDto: RegisterDto = {
      email: 'example@gmail.com',
      username: 'testusername',
      password: 'password',
      confirmPassword: 'password',
      verified: false,
    };

    return request(app.getHttpServer())
      .post('/auth/register')
      .send(registerDto)
      .expect(201)
      .then(() => {
        expect(registerFunc).toHaveBeenCalledWith(registerDto);
      });
  });

  it(`'/auth/confirm/{id}' returns 400 if OTP is invalid`, () => {
    jest.spyOn(authService, 'checkOTP').mockResolvedValue(Result.fail('Fail'));

    return request(app.getHttpServer())
      .post('/auth/confirm/1')
      .send({ otp: 'invalidotp' } as OtpDto)
      .expect(400);
  });

  it(`'/auth/confirm/{id}' returns 200 if successfully confirmed OTP`, () => {
    jest
      .spyOn(authService, 'checkOTP')
      .mockResolvedValue(Result.ok('Success', null));
    jest.spyOn(authService, 'confirmUser').mockResolvedValue();

    return request(app.getHttpServer())
      .post('/auth/confirm/1')
      .send({ otp: 'validotp' } as OtpDto)
      .expect(200);
  });

  it(`'/auth/login' returns 401 if fails`, async () => {
    jest.spyOn(authService, 'login').mockResolvedValue(Result.fail('Fail'));

    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'testusername', password: 'password' })
      .expect(401);
  });

  it(`'/auth/login' returns 200 if user successfully signed in`, async () => {
    const loginFunc = jest.spyOn(authService, 'login').mockResolvedValue(
      Result.ok('Success', {
        accessToken: '',
        refreshToken: '',
        atTime: 1,
        rtTime: 1,
      }),
    );
    const loginDto: LoginDto = {
      username: 'testusername',
      password: 'password',
    };

    return request(app.getHttpServer())
      .post('/auth/login')
      .send(loginDto)
      .expect(200)
      .then((res) => {
        expect(loginFunc).toHaveBeenCalledWith(loginDto);
        expect(res.body).toHaveProperty('data.accessToken');
        expect(res.body).toHaveProperty('data.refreshToken');
        expect(res.body).toHaveProperty('data.atTime');
        expect(res.body).toHaveProperty('data.rtTime');
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
