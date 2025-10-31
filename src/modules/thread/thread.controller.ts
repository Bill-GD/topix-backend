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
import { ThreadQuery } from '@/common/queries';
import { ControllerResponse } from '@/common/utils/controller-response';
import { addPaginateHeader } from '@/common/utils/helpers';
import { threadTable } from '@/database/schemas';
import { NotificationDto } from '@/modules/notification/dto/notification.dto';
import { NotificationService } from '@/modules/notification/notification.service';
import { CreatePostDto } from '@/modules/post/dto/create-post.dto';
import { CreateThreadDto } from '@/modules/thread/dto/create-thread.dto';
import { UpdateThreadDto } from '@/modules/thread/dto/update-thread.dto';
import {
  Body,
  ConflictException,
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
  Res,
  UploadedFiles,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ThreadService } from './thread.service';

@Controller('thread')
@UseGuards(AuthenticatedGuard, GetRequesterGuard)
@ApiController()
export class ThreadController {
  constructor(
    private readonly threadService: ThreadService,
    private readonly notificationService: NotificationService,
  ) {}

  @Get()
  async getAll(
    @Res({ passthrough: true }) response: Response,
    @Query() query: ThreadQuery,
    @RequesterID() requesterId: number,
  ) {
    const res = await this.threadService.getAll(query, requesterId);
    addPaginateHeader(response, res.data.length < query.size);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }

  @Get(':id')
  @UseGuards(ResourceExistGuard)
  @ResourceExistConfig({
    name: 'Thread',
    table: threadTable,
    resourceIdColumn: threadTable.id,
  })
  async getOne(
    @Param('id', ParseIntPipe) threadId: number,
    @RequesterID() requesterId: number,
  ) {
    const res = await this.threadService.getOne(threadId, requesterId);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }

  @Post()
  async createThread(
    @RequesterID() requesterId: number,
    @Body() dto: CreateThreadDto,
  ) {
    const res = await this.threadService.create(dto, requesterId);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.CREATED);
  }

  @Post(':id/post')
  @UseGuards(ResourceExistGuard, ResourceOwnerGuard)
  @ResourceExistConfig({
    name: 'Thread',
    table: threadTable,
    resourceIdColumn: threadTable.id,
  })
  @ResourceOwnerConfig({
    table: threadTable,
    resourceUserIdColumn: threadTable.ownerId,
    resourceIdColumn: threadTable.id,
  })
  @ApiFile('files', CreatePostDto, 'list')
  async addPost(
    @Param('id', ParseIntPipe) threadId: number,
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
    const res = await this.threadService.addPost(threadId, requesterId, dto);

    const { data: followers } = await this.threadService.getFollowers(threadId);
    const dtos: NotificationDto[] = followers.map((id) => ({
      actorId: requesterId,
      actionType: 'update_thread',
      receiverId: id,
      objectId: threadId,
    }));

    for (const dto of dtos) {
      await this.notificationService.create(dto);
    }
    await this.notificationService.emitNotification(dtos);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.CREATED);
  }

  @Post(':id/follow')
  @UseGuards(ResourceExistGuard)
  @ResourceExistConfig({
    name: 'Thread',
    table: threadTable,
    resourceIdColumn: threadTable.id,
  })
  async followThread(
    @Param('id', ParseIntPipe) threadId: number,
    @RequesterID() requesterId: number,
  ) {
    const res = await this.threadService.followThread(threadId, requesterId);
    if (!res.success) {
      return ControllerResponse.fail(new ConflictException(res.message));
    }
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }

  @Patch(':id')
  @UseGuards(ResourceExistGuard, ResourceOwnerGuard)
  @ResourceExistConfig({
    name: 'Thread',
    table: threadTable,
    resourceIdColumn: threadTable.id,
  })
  @ResourceOwnerConfig({
    table: threadTable,
    resourceUserIdColumn: threadTable.ownerId,
    resourceIdColumn: threadTable.id,
  })
  async update(
    @Param('id', ParseIntPipe) threadId: number,
    @Body() dto: UpdateThreadDto,
  ) {
    const res = await this.threadService.update(threadId, dto);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }

  @Delete(':id/follow')
  @UseGuards(ResourceExistGuard)
  @ResourceExistConfig({
    name: 'Thread',
    table: threadTable,
    resourceIdColumn: threadTable.id,
  })
  async unfollowThread(
    @Param('id', ParseIntPipe) threadId: number,
    @RequesterID() requesterId: number,
  ) {
    const res = await this.threadService.unfollowThread(threadId, requesterId);
    if (!res.success) {
      return ControllerResponse.fail(new ConflictException(res.message));
    }
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }

  @Delete(':id')
  @UseGuards(ResourceExistGuard, ResourceOwnerGuard)
  @ResourceExistConfig({
    name: 'Thread',
    table: threadTable,
    resourceIdColumn: threadTable.id,
  })
  @ResourceOwnerConfig({
    table: threadTable,
    resourceUserIdColumn: threadTable.ownerId,
    resourceIdColumn: threadTable.id,
  })
  async remove(@Param('id', ParseIntPipe) threadId: number) {
    const res = await this.threadService.remove(threadId);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }
}
