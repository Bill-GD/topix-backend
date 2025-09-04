import { ApiController } from '@/common/decorators';
import { ControllerResponse } from '@/common/utils/controller-response';
import { AuthService } from '@/modules/auth/auth.service';
import { OtpDto } from '@/modules/auth/dto/otp.dto';
import { RegisterDto } from '@/modules/auth/dto/register.dto';
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiController('application/x-www-form-urlencoded')
  async register(@Body() dto: RegisterDto) {
    if (!(await this.authService.usernameAvailable(dto.username))) {
      throw new ConflictException('Username already taken.');
    }
    if (!(await this.authService.emailAvailable(dto.email))) {
      throw new ConflictException('Email already taken.');
    }

    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Password do not match.');
    }

    const newId = await this.authService.register(dto);

    return ControllerResponse.ok(
      'User registered successfully',
      { id: newId },
      HttpStatus.CREATED,
    );
  }

  @Post('confirm/:id')
  @ApiController()
  async confirmOTP(
    @Param('id', ParseIntPipe) userId: number,
    @Body() dto: OtpDto,
  ) {
    const [success, message] = await this.authService.checkOTP(dto.otp, userId);

    if (!success) throw new BadRequestException(message);
    await this.authService.confirmUser(userId);

    return ControllerResponse.ok(message, null, HttpStatus.OK);
  }

  @Post('resend/:id')
  @ApiController()
  async resendOTP(@Param('id', ParseIntPipe) id: number) {
    await this.authService.sendOTP(id);

    return ControllerResponse.ok(
      'Resent OTP successfully',
      null,
      HttpStatus.OK,
    );
  }
}
