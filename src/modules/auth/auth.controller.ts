import { ApiController } from '@/common/decorators';
import { ControllerResponse } from '@/common/utils/controller-response';
import { AuthService } from '@/modules/auth/auth.service';
import { RegisterDto } from '@/modules/auth/dto/register.dto';
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  HttpStatus,
  Post,
} from '@nestjs/common';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiController('application/x-www-form-urlencoded')
  async register(@Body() dto: RegisterDto) {
    if (!(await this.authService.usernameAvailable(dto.username))) {
      throw new ConflictException('Username not available.');
    }

    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Password do not match.');
    }

    const res = await this.authService.register(dto);

    return ControllerResponse.ok(
      'User registered successfully',
      { id: res },
      HttpStatus.CREATED,
    );
  }
}
