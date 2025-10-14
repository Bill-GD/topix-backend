import { ApiController, ApiFile, RequesterID } from '@/common/decorators';
import {
  AuthenticatedGuard,
  GetRequesterGuard,
  ThreadExistGuard,
  ThreadOwnerGuard,
} from '@/common/guards';
import { FileSizeValidatorPipe } from '@/common/pipes';
import { ThreadQuery } from '@/common/queries';
import { ControllerResponse } from '@/common/utils/controller-response';
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
  UploadedFiles,
  UseGuards,
} from '@nestjs/common';
import { ThreadService } from './thread.service';

@Controller('thread')
@UseGuards(AuthenticatedGuard)
@ApiController()
export class ThreadController {
  constructor(private readonly threadService: ThreadService) {}

  @Get()
  @UseGuards(GetRequesterGuard)
  async getAll(
    @Query() query: ThreadQuery,
    @RequesterID() requesterId: number,
  ) {
    const res = await this.threadService.getAll(query, requesterId);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }

  @Get(':id')
  @UseGuards(ThreadExistGuard, GetRequesterGuard)
  async getOne(
    @Param('id', ParseIntPipe) threadId: number,
    @RequesterID() requesterId: number,
  ) {
    const res = await this.threadService.getOne(threadId, requesterId);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }

  @Post()
  @UseGuards(GetRequesterGuard)
  async createThread(
    @RequesterID() requesterId: number,
    @Body() dto: CreateThreadDto,
  ) {
    const res = await this.threadService.create(dto, requesterId);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.CREATED);
  }

  @Post(':id/post')
  @UseGuards(ThreadExistGuard, GetRequesterGuard, ThreadOwnerGuard)
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
    return ControllerResponse.ok(res.message, res.data, HttpStatus.CREATED);
  }

  @Post(':id/follow')
  @UseGuards(ThreadExistGuard, GetRequesterGuard)
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
  @UseGuards(ThreadExistGuard, GetRequesterGuard, ThreadOwnerGuard)
  async update(
    @Param('id', ParseIntPipe) threadId: number,
    @Body() dto: UpdateThreadDto,
  ) {
    const res = await this.threadService.update(threadId, dto);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }

  @Delete(':id/follow')
  @UseGuards(ThreadExistGuard, GetRequesterGuard)
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
  @UseGuards(ThreadExistGuard, GetRequesterGuard, ThreadOwnerGuard)
  async remove(@Param('id', ParseIntPipe) threadId: number) {
    const res = await this.threadService.remove(threadId);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }
}
