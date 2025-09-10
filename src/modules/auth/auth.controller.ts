import { ApiController } from '@/common/decorators';
import {
  AccountInfoGuard,
  UserExistGuard,
  UserVerifiedGuard,
} from '@/common/guards';
import { ControllerResponse } from '@/common/utils/controller-response';
import { AuthService } from '@/modules/auth/auth.service';
import { LoginDto } from '@/modules/auth/dto/login.dto';
import { OtpDto } from '@/modules/auth/dto/otp.dto';
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
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // @Get('check')
  // @UseGuards(AuthenticatedGuard)
  // @ApiController()
  // checkToken() {
  //   return ControllerResponse.ok('User is authenticated', null, HttpStatus.OK);
  // }

  @Post('register')
  @UseGuards(AccountInfoGuard(false, ['username', 'email']))
  @ApiController('application/x-www-form-urlencoded')
  async register(@Body() dto: RegisterDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Password does not match.');
    }

    const newId = await this.authService.register(dto);

    return ControllerResponse.ok(
      'User registered successfully',
      { id: newId },
      HttpStatus.CREATED,
    );
  }

  @Post('confirm/:id')
  @UseGuards(UserExistGuard('id'), UserVerifiedGuard)
  @ApiController()
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
  @UseGuards(UserExistGuard('id'), UserVerifiedGuard)
  @ApiController()
  async resendOTP(@Param('id', ParseIntPipe) userId: number) {
    await this.authService.sendOTP(userId);

    return ControllerResponse.ok(
      'Resent OTP successfully',
      null,
      HttpStatus.OK,
    );
  }

  @Post('login')
  @UseGuards(AccountInfoGuard(true, ['username']))
  @ApiController('application/x-www-form-urlencoded')
  async login(@Body() dto: LoginDto) {
    const res = await this.authService.login(dto);

    if (!res.success) {
      throw new UnauthorizedException(res.message);
    }

    return ControllerResponse.ok(
      'User logged in successfully',
      res.data!,
      HttpStatus.OK,
    );
  }
}
