import { ApiController, RequesterID } from '@/common/decorators';
import {
  AccountOwnerGuard,
  AuthenticatedGuard,
  GetRequesterGuard,
  UserExistGuard,
} from '@/common/guards';
import { ControllerResponse } from '@/common/utils/controller-response';
import { UpdateProfileDto } from '@/modules/user/dto/update-profile.dto';
import { UserService } from '@/modules/user/user.service';
import {
  Body,
  ConflictException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpStatus,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';

@Controller('user')
@UseGuards(AuthenticatedGuard)
@ApiController()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @UseGuards(GetRequesterGuard)
  async getSelf(@RequesterID() requesterId: number) {
    const user = await this.userService.getUserById(requesterId);

    return ControllerResponse.ok(
      'Fetched user successfully.',
      user,
      HttpStatus.OK,
    );
  }

  @Get(':username')
  @UseGuards(UserExistGuard('username'))
  async getUser(@Param('username') username: string) {
    const user = await this.userService.getUserByUsername(username);

    return ControllerResponse.ok(
      'Fetched user successfully.',
      user,
      HttpStatus.OK,
    );
  }

  @Patch('me')
  @UseGuards(GetRequesterGuard)
  async updateProfile(
    @RequesterID() requesterId: number,
    @Body() dto: UpdateProfileDto,
  ) {
    const res = await this.userService.updateProfileInfo(requesterId, dto);

    if (!res.success) {
      throw new ConflictException(res.message);
    }

    return ControllerResponse.ok(res.message, null, HttpStatus.OK);
  }

  @Delete(':username')
  @UseGuards(UserExistGuard('username'), AccountOwnerGuard(true))
  async deleteProfile(@Param('username') username: string) {
    const res = await this.userService.deleteUser(username);

    if (!res.success) {
      throw new ForbiddenException(res.message);
    }

    return ControllerResponse.ok(res.message, null, HttpStatus.OK);
  }
}
