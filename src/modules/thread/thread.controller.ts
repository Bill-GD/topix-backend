import { ApiController, RequesterID } from '@/common/decorators';
import {
  AuthenticatedGuard,
  GetRequesterGuard,
  ThreadExistGuard,
} from '@/common/guards';
import { ThreadQuery } from '@/common/queries';
import { ControllerResponse } from '@/common/utils/controller-response';
import { CreatePostDto } from '@/modules/post/dto/create-post.dto';
import { CreateThreadDto } from '@/modules/thread/dto/create-thread.dto';
import { UpdateThreadDto } from '@/modules/thread/dto/update-thread.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
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
  @UseGuards(ThreadExistGuard, GetRequesterGuard)
  async addPost(
    @Param('id', ParseIntPipe) threadId: number,
    @RequesterID() requesterId: number,
    @Body() dto: CreatePostDto,
  ) {
    const res = await this.threadService.addPost(threadId, requesterId, dto);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.CREATED);
  }

  @Patch(':id')
  @UseGuards(ThreadExistGuard)
  async update(
    @Param('id', ParseIntPipe) threadId: number,
    @Body() dto: UpdateThreadDto,
  ) {
    const res = await this.threadService.update(threadId, dto);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }

  // @Delete(':id')
  // @UseGuards(ThreadExistGuard)
  // async remove(@Param('id', ParseIntPipe) threadId: number) {
  //   const res = await this.threadService.remove(threadId);
  //   return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  // }
}
