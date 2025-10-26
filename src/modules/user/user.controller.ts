import { ApiController, ApiFile, RequesterID } from '@/common/decorators';
import {
  AccountOwnerGuard,
  AuthenticatedGuard,
  GetRequesterGuard,
  IsAdminGuard,
  UserExistGuard,
} from '@/common/guards';
import { FileSizeValidatorPipe } from '@/common/pipes';
import { UserQuery } from '@/common/queries';
import { ControllerResponse } from '@/common/utils/controller-response';
import { addPaginateHeader } from '@/common/utils/helpers';
import { NotificationService } from '@/modules/notification/notification.service';
import { UpdateProfileDto } from '@/modules/user/dto/update-profile.dto';
import { UserService } from '@/modules/user/user.service';
import {
  Body,
  ConflictException,
  Controller,
  Delete,
  FileTypeValidator,
  ForbiddenException,
  Get,
  HttpStatus,
  Param,
  ParseFilePipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';

@Controller('user')
@UseGuards(AuthenticatedGuard)
@ApiController()
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly notificationService: NotificationService,
  ) {}

  @Get()
  @UseGuards(AuthenticatedGuard, GetRequesterGuard, IsAdminGuard)
  async getAll(
    @Res({ passthrough: true }) response: Response,
    @Query() query: UserQuery,
  ) {
    const res = await this.userService.getUsers(query);
    addPaginateHeader(response, res.data.length < query.size);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }

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
  @UseGuards(UserExistGuard('username'), GetRequesterGuard)
  async getUser(
    @Param('username') username: string,
    @RequesterID() requesterId: number,
  ) {
    const user = await this.userService.getUserByUsername(
      username,
      requesterId,
    );

    return ControllerResponse.ok(
      'Fetched user successfully.',
      user,
      HttpStatus.OK,
    );
  }

  @Post(':id/follow')
  @UseGuards(UserExistGuard('id'), GetRequesterGuard)
  async followUser(
    @Param('id', ParseIntPipe) userId: number,
    @RequesterID() requesterId: number,
  ) {
    const res = await this.userService.followUser(userId, requesterId);
    if (!res.success) {
      return ControllerResponse.fail(new ConflictException(res.message));
    }

    await this.notificationService.create({
      actorId: requesterId,
      type: 'follow',
      receiverId: userId,
      objectId: userId,
    });
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }

  @Patch('me')
  @UseGuards(GetRequesterGuard)
  @ApiFile('profilePicture', UpdateProfileDto, 'single')
  async updateProfile(
    @RequesterID() requesterId: number,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({
            fileType: 'image/*',
            fallbackToMimetype: true,
          }),
        ],
        fileIsRequired: false,
      }),
      new FileSizeValidatorPipe(),
    )
    profilePicture: Express.Multer.File,
    @Body() dto: UpdateProfileDto,
  ) {
    if (profilePicture) dto.profilePictureFile = profilePicture;
    const res = await this.userService.updateProfileInfo(requesterId, dto);

    if (!res.success) {
      throw new ConflictException(res.message);
    }

    return ControllerResponse.ok(res.message, null, HttpStatus.OK);
  }

  @Delete(':id/follow')
  @UseGuards(UserExistGuard('id'), GetRequesterGuard)
  async unfollowUser(
    @Param('id', ParseIntPipe) userId: number,
    @RequesterID() requesterId: number,
  ) {
    const res = await this.userService.unfollowUser(userId, requesterId);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
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
