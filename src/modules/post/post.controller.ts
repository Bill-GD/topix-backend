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
import { PostQuery } from '@/common/queries';
import { CommonQuery } from '@/common/queries/common.query';
import { ControllerResponse } from '@/common/utils/controller-response';
import { addPaginateHeader } from '@/common/utils/helpers';
import { postTable } from '@/database/schemas';
import { NotificationDto } from '@/modules/notification/dto/notification.dto';
import { NotificationService } from '@/modules/notification/notification.service';
import { UpdatePostDto } from '@/modules/post/dto/update-post.dto';
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
  Res,
  UploadedFiles,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { CreatePostDto } from './dto/create-post.dto';
import { ReactDto } from './dto/react.dto';
import { PostService } from './post.service';

@Controller('post')
@UseGuards(AuthenticatedGuard, GetRequesterGuard)
@ApiController()
export class PostController {
  constructor(
    private readonly postService: PostService,
    private readonly notificationService: NotificationService,
  ) {}

  @Post()
  @ApiFile('files', CreatePostDto, 'list')
  async create(
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
    if (files && files.length > 0) dto.fileObjects = files;
    const res = await this.postService.create(requesterId, dto);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.CREATED);
  }

  @Get()
  async getAll(
    @Res({ passthrough: true }) response: Response,
    @Query() query: PostQuery,
    @RequesterID() requesterId: number,
  ) {
    const res = await this.postService.getAll(query, requesterId);
    addPaginateHeader(response, res.data.length < query.size);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }

  @Get('following')
  async getAllFollowing(
    @Res({ passthrough: true }) response: Response,
    @Query() query: CommonQuery,
    @RequesterID() requesterId: number,
  ) {
    const res = await this.postService.getAllFollowing(query, requesterId);
    addPaginateHeader(response, res.data.length < query.size);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }

  @Get(':id')
  @UseGuards(ResourceExistGuard)
  @ResourceExistConfig({
    name: 'Post',
    table: postTable,
    resourceIdColumn: postTable.id,
  })
  async getOne(
    @Param('id', ParseIntPipe) postId: number,
    @RequesterID() requesterId: number,
  ) {
    const res = await this.postService.getOne(postId, requesterId);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }

  @Patch(':id')
  @UseGuards(ResourceExistGuard, ResourceOwnerGuard)
  @ResourceExistConfig({
    name: 'Post',
    table: postTable,
    resourceIdColumn: postTable.id,
  })
  @ResourceOwnerConfig({
    table: postTable,
    resourceUserIdColumn: postTable.ownerId,
    resourceIdColumn: postTable.id,
  })
  async update(
    @Param('id', ParseIntPipe) postId: number,
    @Body() dto: UpdatePostDto,
  ) {
    const res = await this.postService.update(postId, dto);
    return ControllerResponse.ok(res.message, null, HttpStatus.OK);
  }

  @Delete(':id')
  @UseGuards(ResourceExistGuard, ResourceOwnerGuard)
  @ResourceExistConfig({
    name: 'Post',
    table: postTable,
    resourceIdColumn: postTable.id,
  })
  @ResourceOwnerConfig({
    table: postTable,
    resourceUserIdColumn: postTable.ownerId,
    resourceIdColumn: postTable.id,
    allowAdmin: true,
  })
  async remove(@Param('id', ParseIntPipe) postId: number) {
    const res = await this.postService.remove(postId);
    return ControllerResponse.ok(res.message, null, HttpStatus.OK);
  }

  @Patch(':id/react')
  @UseGuards(ResourceExistGuard)
  @ResourceExistConfig({
    name: 'Post',
    table: postTable,
    resourceIdColumn: postTable.id,
  })
  async react(
    @Param('id', ParseIntPipe) postId: number,
    @RequesterID() requesterId: number,
    @Body() dto: ReactDto,
  ) {
    const res = await this.postService.updateReaction(postId, requesterId, dto);
    const {
      data: {
        owner: { id: ownerId },
      },
    } = await this.postService.getOne(postId, requesterId);

    const notiDto: NotificationDto = {
      actorId: requesterId,
      actionType: 'react',
      receiverId: ownerId,
      objectId: postId,
    };
    await this.notificationService.create(notiDto);
    await this.notificationService.emitNotification([notiDto]);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }

  @Delete(':id/react')
  @UseGuards(ResourceExistGuard)
  @ResourceExistConfig({
    name: 'Post',
    table: postTable,
    resourceIdColumn: postTable.id,
  })
  async removeReaction(
    @Param('id', ParseIntPipe) postId: number,
    @RequesterID() requesterId: number,
  ) {
    const res = await this.postService.removeReaction(postId, requesterId);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }

  @Post(':id/reply')
  @UseGuards(ResourceExistGuard)
  @ResourceExistConfig({
    name: 'Post',
    table: postTable,
    resourceIdColumn: postTable.id,
  })
  @ApiFile('files', CreatePostDto, 'list')
  async reply(
    @Param('id', ParseIntPipe) postId: number,
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
    if (files && files.length > 0) dto.fileObjects = files;
    const res = await this.postService.reply(postId, requesterId, dto);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }
}
