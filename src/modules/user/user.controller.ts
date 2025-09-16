import { ApiController } from '@/common/decorators';
import {
  AccountOwnerGuard,
  AuthenticatedGuard,
  GetRequesterGuard,
  UserExistGuard,
} from '@/common/guards';
import { ControllerResponse } from '@/common/utils/controller-response';
import { PostService } from '@/modules/post/post.service';
import { UpdateProfileDto } from '@/modules/user/dto/update-profile.dto';
import { UserService } from '@/modules/user/user.service';
import {
  Body,
  ConflictException,
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
@UseGuards(AuthenticatedGuard)
@ApiController()
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly postService: PostService,
  ) {}

  @Get('me')
  @UseGuards(GetRequesterGuard)
  async getSelf(@Req() request: Request) {
    const user = await this.userService.getUserById(
      request['userId'] as number,
    );

    return ControllerResponse.ok(
      'Fetched user successfully',
      user,
      HttpStatus.OK,
    );
  }

  @Get(':username')
  @UseGuards(UserExistGuard('username'))
  async getUser(@Param('username') username: string) {
    const user = await this.userService.getUserByUsername(username);

    return ControllerResponse.ok(
      'Fetched user successfully',
      user,
      HttpStatus.OK,
    );
  }

  @Get(':username/posts')
  @UseGuards(UserExistGuard('username'), GetRequesterGuard)
  async getUserPosts(@Param('username') username: string, @Req() req: Request) {
    const user = await this.userService.getUserByUsername(username);
    const res = await this.postService.getPostsOfUser(
      user.id,
      req['userId'] as number,
    );
    const posts = res.data.map((p) => ({ ...p, owner: user }));

    return ControllerResponse.ok(res.message, posts, HttpStatus.OK);
  }

  @Patch('me')
  @UseGuards(GetRequesterGuard)
  async updateProfile(@Req() request: Request, @Body() dto: UpdateProfileDto) {
    const res = await this.userService.updateProfileInfo(
      request['userId'] as number,
      dto,
    );

    if (!res.success) {
      throw new ConflictException(res.message);
    }

    return ControllerResponse.ok(res.message, null, HttpStatus.OK);
  }

  @Delete(':username')
  @UseGuards(
    UserExistGuard('username'),
    AccountOwnerGuard(true),
    // ResourceOwnerGuard('username', userTable, userTable.id, true),
  )
  async deleteProfile(@Param('username') username: string) {
    await this.userService.deleteUser(username);

    return ControllerResponse.ok(
      'User deleted successfully',
      null,
      HttpStatus.OK,
    );
  }
}
