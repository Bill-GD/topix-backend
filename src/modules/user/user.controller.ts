import { ApiController } from '@/common/decorators';
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
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @UseGuards(AuthenticatedGuard, GetRequesterGuard)
  @ApiController()
  async getSelf(@Req() request: Request) {
    const user = await this.userService.getUserByUsername(
      request['username'] as string,
    );

    return ControllerResponse.ok(
      'Fetched user successfully',
      user,
      HttpStatus.OK,
    );
  }

  @Get(':username')
  @UseGuards(AuthenticatedGuard, UserExistGuard('username'))
  @ApiController()
  async getUser(@Param('username') username: string) {
    const user = await this.userService.getUserByUsername(username);

    return ControllerResponse.ok(
      'Fetched user successfully',
      user,
      HttpStatus.OK,
    );
  }

  @Patch(':username')
  @UseGuards(
    AuthenticatedGuard,
    UserExistGuard('username'),
    AccountOwnerGuard(false),
  )
  @ApiController()
  async updateProfile(
    @Param('username') username: string,
    @Body() dto: UpdateProfileDto,
  ) {
    await this.userService.updateProfileInfo(dto);

    return ControllerResponse.ok(
      'User profile updated successfully',
      null,
      HttpStatus.OK,
    );
  }

  @Delete(':username')
  @UseGuards(
    AuthenticatedGuard,
    UserExistGuard('username'),
    AccountOwnerGuard(true),
    // ResourceOwnerGuard('username', userTable, userTable.id, true),
  )
  @ApiController()
  async deleteProfile(@Param('username') username: string) {
    await this.userService.deleteUser(username);

    return ControllerResponse.ok(
      'User deleted successfully',
      null,
      HttpStatus.OK,
    );
  }
}
