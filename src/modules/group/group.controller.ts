import {
  ApiController,
  ApiFile,
  RequesterID,
  ResourceExistConfig,
  ResourceOwnerConfig,
} from '@/common/decorators';
import {
  AuthenticatedGuard,
  GetRequesterGuard,
  ResourceExistGuard,
  ResourceOwnerGuard,
} from '@/common/guards';
import { FileSizeValidatorPipe } from '@/common/pipes';
import { GroupQuery, MemberQuery } from '@/common/queries';
import { ImageSizeLimit } from '@/common/utils/constants';
import { ControllerResponse } from '@/common/utils/controller-response';
import { addPaginateHeader, getReadableSize } from '@/common/utils/helpers';
import { groupTable, tagTable } from '@/database/schemas';
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
  Res,
  UploadedFile,
  UploadedFiles,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
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
  async getAll(
    @Res({ passthrough: true }) response: Response,
    @Query() query: GroupQuery,
    @RequesterID() requesterId: number,
  ) {
    const res = await this.groupService.getAll(query, requesterId);
    addPaginateHeader(response, res.data.length < query.size);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }

  @Get(':id')
  @UseGuards(ResourceExistGuard)
  @ResourceExistConfig({
    name: 'Group',
    table: groupTable,
    resourceIdColumn: groupTable.id,
  })
  async getOne(
    @Param('id', ParseIntPipe) groupId: number,
    @RequesterID() requesterId: number,
  ) {
    const res = await this.groupService.getOne(groupId, requesterId);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }

  // unused
  @Get(':id/join-status')
  async getJoinStatus(
    @Param('id', ParseIntPipe) groupId: number,
    @RequesterID() requesterId: number,
  ) {
    const res = await this.groupService.getJoinStatus(groupId, requesterId);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }

  @Get(':id/tags')
  async getAllTags(@Param('id', ParseIntPipe) groupId: number) {
    const res = await this.groupService.getAllTags(groupId);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }

  @Get(':id/members')
  @UseGuards(ResourceExistGuard)
  @ResourceExistConfig({
    name: 'Group',
    table: groupTable,
    resourceIdColumn: groupTable.id,
  })
  async getAllMembers(
    @Res({ passthrough: true }) response: Response,
    @Query() query: MemberQuery,
    @Param('id', ParseIntPipe) groupId: number,
  ) {
    const res = await this.groupService.getAllMembers(groupId, query);
    addPaginateHeader(response, res.data.length < query.size);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }

  @Post(':id/join')
  @UseGuards(ResourceExistGuard)
  @ResourceExistConfig({
    name: 'Group',
    table: groupTable,
    resourceIdColumn: groupTable.id,
  })
  async joinGroup(
    @Param('id', ParseIntPipe) groupId: number,
    @RequesterID() requesterId: number,
  ) {
    const res = await this.groupService.joinGroup(groupId, requesterId);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }

  @Post(':id/post')
  @UseGuards(ResourceExistGuard)
  @ResourceExistConfig({
    name: 'Group',
    table: groupTable,
    resourceIdColumn: groupTable.id,
  })
  @ApiFile('files', CreatePostDto, 'list')
  async addPost(
    @Param('id', ParseIntPipe) groupId: number,
    @RequesterID() requesterId: number,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({
            fileType: '(image|video)/*',
            fallbackToMimetype: true,
          }),
        ],
        fileIsRequired: false,
      }),
      new FileSizeValidatorPipe(),
    )
    files: Array<Express.Multer.File>,
    @Body() dto: CreatePostDto,
  ) {
    if (files) dto.fileObjects = files;
    const res = await this.groupService.addPost(groupId, requesterId, dto);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.CREATED);
  }

  @Post(':id/thread')
  @UseGuards(ResourceExistGuard)
  @ResourceExistConfig({
    name: 'Group',
    table: groupTable,
    resourceIdColumn: groupTable.id,
  })
  async addThread(
    @Param('id', ParseIntPipe) groupId: number,
    @RequesterID() requesterId: number,
    @Body() dto: CreateThreadDto,
  ) {
    const res = await this.groupService.addThread(groupId, requesterId, dto);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.CREATED);
  }

  @Post(':id/tag')
  @UseGuards(ResourceExistGuard, ResourceOwnerGuard)
  @ResourceExistConfig({
    name: 'Group',
    table: groupTable,
    resourceIdColumn: groupTable.id,
  })
  @ResourceOwnerConfig({
    table: groupTable,
    resourceUserIdColumn: groupTable.ownerId,
    resourceIdColumn: groupTable.id,
  })
  async addTag(
    @Param('id', ParseIntPipe) groupId: number,
    @Body() dto: CreateTagDto,
  ) {
    const res = await this.groupService.addTag(groupId, dto);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.CREATED);
  }

  @Post(':id/change-owner')
  @UseGuards(ResourceExistGuard, ResourceOwnerGuard)
  @ResourceExistConfig({
    name: 'Group',
    table: groupTable,
    resourceIdColumn: groupTable.id,
  })
  @ResourceOwnerConfig({
    table: groupTable,
    resourceUserIdColumn: groupTable.ownerId,
    resourceIdColumn: groupTable.id,
  })
  async changeOwner(
    @Param('id', ParseIntPipe) groupId: number,
    @Body() dto: { newOwnerId: number },
  ) {
    const res = await this.groupService.changeOwner(groupId, dto.newOwnerId);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.CREATED);
  }

  @Post(':id/member/:userId')
  @UseGuards(ResourceExistGuard, ResourceOwnerGuard)
  @ResourceExistConfig({
    name: 'Group',
    table: groupTable,
    resourceIdColumn: groupTable.id,
  })
  @ResourceOwnerConfig({
    table: groupTable,
    resourceUserIdColumn: groupTable.ownerId,
    resourceIdColumn: groupTable.id,
  })
  async acceptMember(
    @Param('id', ParseIntPipe) groupId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    const res = await this.groupService.acceptMember(groupId, userId);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }

  @Post(':id/post/:postId')
  @UseGuards(ResourceExistGuard, ResourceOwnerGuard)
  @ResourceExistConfig({
    name: 'Group',
    table: groupTable,
    resourceIdColumn: groupTable.id,
  })
  @ResourceOwnerConfig({
    table: groupTable,
    resourceUserIdColumn: groupTable.ownerId,
    resourceIdColumn: groupTable.id,
  })
  async acceptPost(@Param('postId', ParseIntPipe) postId: number) {
    const res = await this.groupService.acceptPost(postId);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }

  @Patch(':id')
  @ApiFile('banner', UpdateGroupDto, 'single')
  @UseGuards(ResourceExistGuard, ResourceOwnerGuard)
  @ResourceExistConfig({
    name: 'Group',
    table: groupTable,
    resourceIdColumn: groupTable.id,
  })
  @ResourceOwnerConfig({
    table: groupTable,
    resourceUserIdColumn: groupTable.ownerId,
    resourceIdColumn: groupTable.id,
  })
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
  @UseGuards(ResourceExistGuard)
  @ResourceExistConfig({
    name: 'Group',
    table: groupTable,
    resourceIdColumn: groupTable.id,
  })
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
  @UseGuards(ResourceExistGuard, ResourceOwnerGuard)
  @ResourceExistConfig(
    {
      name: 'Group',
      table: groupTable,
      resourceIdColumn: groupTable.id,
    },
    {
      name: 'Tag',
      table: tagTable,
      resourceIdColumn: tagTable.id,
    },
  )
  @ResourceOwnerConfig({
    table: groupTable,
    resourceUserIdColumn: groupTable.ownerId,
    resourceIdColumn: groupTable.id,
  })
  async removeTag(@Param('tagId', ParseIntPipe) tagId: number) {
    const res = await this.groupService.removeTag(tagId);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }

  @Delete(':id/member/:userId')
  @UseGuards(ResourceExistGuard, ResourceOwnerGuard)
  @ResourceExistConfig({
    name: 'Group',
    table: groupTable,
    resourceIdColumn: groupTable.id,
  })
  @ResourceOwnerConfig({
    table: groupTable,
    resourceUserIdColumn: groupTable.ownerId,
    resourceIdColumn: groupTable.id,
  })
  async deleteMember(
    @Param('id', ParseIntPipe) groupId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    const res = await this.groupService.removeMember(groupId, userId);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.CREATED);
  }

  @Delete(':id')
  @UseGuards(ResourceExistGuard, ResourceOwnerGuard)
  @ResourceExistConfig({
    name: 'Group',
    table: groupTable,
    resourceIdColumn: groupTable.id,
  })
  @ResourceOwnerConfig({
    table: groupTable,
    resourceUserIdColumn: groupTable.ownerId,
    resourceIdColumn: groupTable.id,
  })
  async remove(@Param('id', ParseIntPipe) groupId: number) {
    const res = await this.groupService.remove(groupId);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }
}
