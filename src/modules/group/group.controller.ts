import { ApiController, ApiFile, RequesterID } from '@/common/decorators';
import {
  AuthenticatedGuard,
  GetRequesterGuard,
  GroupExistGuard,
  GroupOwnerGuard,
} from '@/common/guards';
import { GroupQuery } from '@/common/queries';
import { ControllerResponse } from '@/common/utils/controller-response';
import { CreatePostDto } from '@/modules/post/dto/create-post.dto';
import { CreateThreadDto } from '@/modules/thread/dto/create-thread.dto';
import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  HttpStatus,
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

  @Post(':id/post')
  @UseGuards(GroupExistGuard, GetRequesterGuard, GroupOwnerGuard)
  async addPost(
    @Param('id', ParseIntPipe) groupId: number,
    @RequesterID() requesterId: number,
    @Body() dto: CreatePostDto,
  ) {
    const res = await this.groupService.addPost(groupId, requesterId, dto);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.CREATED);
  }

  @Post(':id/thread')
  @UseGuards(GroupExistGuard, GetRequesterGuard, GroupOwnerGuard)
  async addThread(
    @Param('id', ParseIntPipe) groupId: number,
    @RequesterID() requesterId: number,
    @Body() dto: CreateThreadDto,
  ) {
    const res = await this.groupService.addThread(groupId, requesterId, dto);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.CREATED);
  }

  @Patch(':id')
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

  @Delete(':id')
  @UseGuards(GroupExistGuard, GroupOwnerGuard)
  async remove(@Param('id', ParseIntPipe) groupId: number) {
    const res = await this.groupService.remove(groupId);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }
}
