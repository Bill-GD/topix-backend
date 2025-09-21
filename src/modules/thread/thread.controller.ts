import { ApiController, RequesterID } from '@/common/decorators';
import {
  AuthenticatedGuard,
  GetRequesterGuard,
  ThreadExistGuard,
} from '@/common/guards';
import { ThreadQuery } from '@/common/queries';
import { ControllerResponse } from '@/common/utils/controller-response';
import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
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

  // @Post()
  // createThread(@Body() createThreadDto: CreateThreadDto) {
  //   return this.threadService.create(createThreadDto);
  // }

  // @Post(':id/post')
  // createPost(
  //   @Param('id', ParseIntPipe) threadId: number,
  //   @Body() createThreadDto: CreateThreadDto,
  // ) {
  //   return this.threadService.create(createThreadDto);
  // }

  // @Patch(':id')
  // update(
  //   @Param('id', ParseIntPipe) threadId: number,
  //   @Body() updateThreadDto: UpdateThreadDto,
  // ) {
  //   return this.threadService.update(threadId, updateThreadDto);
  // }

  // @Delete(':id')
  // remove(@Param('id', ParseIntPipe) threadId: number) {
  //   return this.threadService.remove(threadId);
  // }
}
