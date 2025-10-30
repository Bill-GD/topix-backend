import {
  AccountInfo,
  ApiController,
  RequesterID,
  UserExist,
} from '@/common/decorators';
import {
  AccountInfoGuard,
  AuthenticatedGuard,
  GetRequesterGuard,
  RefreshTokenGuard,
  UserExistGuard,
  UserVerifiedGuard,
} from '@/common/guards';
import { ControllerResponse } from '@/common/utils/controller-response';
import { AuthService } from '@/modules/auth/auth.service';
import { LoginDto } from '@/modules/auth/dto/login.dto';
import { OtpDto } from '@/modules/auth/dto/otp.dto';
import { PasswordCheckDto } from '@/modules/auth/dto/password-check.dto';
import { RegisterDto } from '@/modules/auth/dto/register.dto';
import {
  BadRequestException,
  Body,
  Controller,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

@Controller('auth')
@ApiController()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('refresh')
  @UseGuards(RefreshTokenGuard, GetRequesterGuard)
  async refreshAccess(@RequesterID() requesterId: number) {
    const res = await this.authService.refresh(requesterId);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }

  @Post('password-check')
  @UseGuards(AuthenticatedGuard, GetRequesterGuard)
  async checkPassword(
    @RequesterID() requesterId: number,
    @Body() dto: PasswordCheckDto,
  ) {
    if (!(await this.authService.checkPassword(requesterId, dto.password))) {
      throw new BadRequestException('Wrong password.');
    }
    return ControllerResponse.ok('Password is correct.', null, HttpStatus.OK);
  }

  @Post('register')
  @UseGuards(AccountInfoGuard)
  @AccountInfo({ shouldExist: false, checks: ['username', 'email'] })
  async register(@Body() dto: RegisterDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Provided passwords do not match.');
    }

    const newId = await this.authService.register(dto);

    return ControllerResponse.ok(
      'Registered successfully.',
      { id: newId },
      HttpStatus.CREATED,
    );
  }

  @Post('confirm/:id')
  @UseGuards(UserExistGuard, UserVerifiedGuard)
  @UserExist({ check: 'id' })
  async confirmOTP(
    @Param('id', ParseIntPipe) userId: number,
    @Body() dto: OtpDto,
  ) {
    const { success, message } = await this.authService.checkOTP(
      dto.otp,
      userId,
    );

    if (!success) throw new BadRequestException(message);
    await this.authService.confirmUser(userId);

    return ControllerResponse.ok(message, null, HttpStatus.OK);
  }

  @Post('resend/:id')
  @UseGuards(UserExistGuard, UserVerifiedGuard)
  @UserExist({ check: 'id' })
  async resendOTP(@Param('id', ParseIntPipe) userId: number) {
    await this.authService.sendOTP(userId);

    return ControllerResponse.ok(
      'Resent OTP successfully.',
      null,
      HttpStatus.OK,
    );
  }

  @Post('login')
  @UseGuards(AccountInfoGuard)
  @AccountInfo({ shouldExist: true, checks: ['username'] })
  async login(@Body() dto: LoginDto) {
    const res = await this.authService.login(dto);
    if (!res.success) throw new UnauthorizedException(res.message);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }
}
