import { AuthenticatedGuard, UserExistGuard } from '@/common/guards';
import { ControllerResponse } from '@/common/utils/controller-response';
import { UserService } from '@/modules/user/user.service';
import { Controller, Get, HttpStatus, Param, UseGuards } from '@nestjs/common';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':username')
  @UseGuards(AuthenticatedGuard, UserExistGuard('username'))
  async register(@Param('username') username: string) {
    const user = await this.userService.getUserByUsername(username);

    return ControllerResponse.ok(
      'Fetched user successfully',
      user,
      HttpStatus.OK,
    );
  }
}
