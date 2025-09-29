import { ApiController, ApiFile, RequesterID } from '@/common/decorators';
import {
  AuthenticatedGuard,
  GetRequesterGuard,
  GroupExistGuard,
  GroupOwnerGuard,
  TagExistGuard,
} from '@/common/guards';
import { GroupQuery } from '@/common/queries';
import { ImageSizeLimit } from '@/common/utils/constants';
import { ControllerResponse } from '@/common/utils/controller-response';
import { getReadableSize } from '@/common/utils/helpers';
import { CreateTagDto } from '@/modules/group/dto/create-tag.dto';
import { CreatePostDto } from '@/modules/post/dto/create-post.dto';
import { CreateThreadDto } from '@/modules/thread/dto/create-thread.dto';
import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  HttpStatus,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupService } from './group.service';

@Controller('group')
@UseGuards(AuthenticatedGuard, GetRequesterGuard)
@ApiController()
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Post()
  @ApiFile('banner', CreateGroupDto, 'single')
  async createGroup(
    @RequesterID() requesterId: number,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({
            fileType: 'image/*',
            fallbackToMimetype: true,
          }),
          new MaxFileSizeValidator({
            maxSize: ImageSizeLimit,
            message: `Image size must be within ${getReadableSize(ImageSizeLimit)}.`,
          }),
        ],
        fileIsRequired: false,
      }),
    )
    banner: Express.Multer.File,
    @Body() dto: CreateGroupDto,
  ) {
    if (banner) dto.bannerFile = banner;
    const res = await this.groupService.create(dto, requesterId);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.CREATED);
  }

  @Get()
  async getAll(@Query() query: GroupQuery, @RequesterID() requesterId: number) {
    const res = await this.groupService.getAll(query, requesterId);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }

  @Get(':id')
  @UseGuards(GroupExistGuard)
  async getOne(
    @Param('id', ParseIntPipe) groupId: number,
    @RequesterID() requesterId: number,
  ) {
    const res = await this.groupService.getOne(groupId, requesterId);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }

  @Get(':id/tags')
  async getAllTags(@Param('id', ParseIntPipe) groupId: number) {
    const res = await this.groupService.getAllTags(groupId);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }

  @Post(':id/join')
  @UseGuards(GroupExistGuard)
  async joinGroup(
    @Param('id', ParseIntPipe) groupId: number,
    @RequesterID() requesterId: number,
  ) {
    const res = await this.groupService.joinGroup(groupId, requesterId);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }

  @Post(':id/post')
  @UseGuards(GroupExistGuard)
  async addPost(
    @Param('id', ParseIntPipe) groupId: number,
    @RequesterID() requesterId: number,
    @Body() dto: CreatePostDto,
  ) {
    const res = await this.groupService.addPost(groupId, requesterId, dto);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.CREATED);
  }

  @Post(':id/thread')
  @UseGuards(GroupExistGuard)
  async addThread(
    @Param('id', ParseIntPipe) groupId: number,
    @RequesterID() requesterId: number,
    @Body() dto: CreateThreadDto,
  ) {
    const res = await this.groupService.addThread(groupId, requesterId, dto);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.CREATED);
  }

  @Post(':id/tag')
  @UseGuards(GroupExistGuard, GroupOwnerGuard)
  async addTag(
    @Param('id', ParseIntPipe) groupId: number,
    @Body() dto: CreateTagDto,
  ) {
    const res = await this.groupService.addTag(groupId, dto);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.CREATED);
  }

  @Post(':id/change-owner')
  @UseGuards(GroupExistGuard, GroupOwnerGuard)
  async changeOwner(
    @Param('id', ParseIntPipe) groupId: number,
    @Body() dto: { newOwnerId: number },
  ) {
    const res = await this.groupService.changeOwner(groupId, dto.newOwnerId);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.CREATED);
  }

  @Post(':id/member/:userId')
  @UseGuards(GroupExistGuard, GroupOwnerGuard)
  async acceptMember(
    @Param('id', ParseIntPipe) groupId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    const res = await this.groupService.acceptMember(groupId, userId);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }

  @Post(':id/post/:postId')
  @UseGuards(GroupExistGuard, GroupOwnerGuard)
  async acceptPost(@Param('postId', ParseIntPipe) postId: number) {
    const res = await this.groupService.acceptPost(postId);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }

  @Patch(':id')
  @ApiFile('banner', UpdateGroupDto, 'single')
  @UseGuards(GroupExistGuard, GroupOwnerGuard)
  async update(
    @Param('id', ParseIntPipe) groupId: number,
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
    )
    banner: Express.Multer.File,
    @Body() dto: UpdateGroupDto,
  ) {
    if (banner) dto.bannerFile = banner;
    const res = await this.groupService.update(groupId, dto);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }

  @Delete(':id/member')
  @UseGuards(GroupExistGuard)
  async leaveGroup(
    @Param('id', ParseIntPipe) groupId: number,
    @RequesterID() requesterId: number,
  ) {
    const res = await this.groupService.removeMember(groupId, requesterId);
    return ControllerResponse.ok(
      'Left group successfully.',
      res.data,
      HttpStatus.OK,
    );
  }

  @Delete(':id/tag/:tagId')
  @UseGuards(GroupExistGuard, GroupOwnerGuard, TagExistGuard)
  async removeTag(@Param('tagId', ParseIntPipe) tagId: number) {
    const res = await this.groupService.removeTag(tagId);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }

  @Delete(':id/member/:userId')
  @UseGuards(GroupExistGuard, GroupOwnerGuard)
  async deleteMember(
    @Param('id', ParseIntPipe) groupId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    const res = await this.groupService.removeMember(groupId, userId);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.CREATED);
  }

  @Delete(':id')
  @UseGuards(GroupExistGuard, GroupOwnerGuard)
  async remove(@Param('id', ParseIntPipe) groupId: number) {
    const res = await this.groupService.remove(groupId);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }
}
