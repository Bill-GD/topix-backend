import { ApiController } from '@/common/decorators';
import { AuthenticatedGuard } from '@/common/guards';
import { ThreadQuery } from '@/common/queries';
import { ControllerResponse } from '@/common/utils/controller-response';
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
import { CreateThreadDto } from './dto/create-thread.dto';
import { UpdateThreadDto } from './dto/update-thread.dto';
import { ThreadService } from './thread.service';

@Controller('thread')
@UseGuards(AuthenticatedGuard)
@ApiController()
export class ThreadController {
  constructor(private readonly threadService: ThreadService) {}

  @Get()
  getAll(@Query() query: ThreadQuery) {
    this.threadService.getAll();
    return ControllerResponse.ok('res.message', 'res.data', HttpStatus.OK);
  }

  // @Post()
  // createThread(@Body() createThreadDto: CreateThreadDto) {
  //   return this.threadService.create(createThreadDto);
  // }
  //
  // @Post(':id/post')
  // createPost(
  //   @Param('id', ParseIntPipe) threadId: number,
  //   @Body() createThreadDto: CreateThreadDto,
  // ) {
  //   return this.threadService.create(createThreadDto);
  // }
  //
  // @Get(':id')
  // getOne(@Param('id', ParseIntPipe) threadId: number) {
  //   return this.threadService.findOne(threadId);
  // }
  //
  // @Get(':id/posts')
  // getPosts(@Param('id', ParseIntPipe) threadId: number) {
  //   return this.threadService.findOne(threadId);
  // }
  //
  // @Patch(':id')
  // update(
  //   @Param('id', ParseIntPipe) threadId: number,
  //   @Body() updateThreadDto: UpdateThreadDto,
  // ) {
  //   return this.threadService.update(threadId, updateThreadDto);
  // }
  //
  // @Delete(':id')
  // remove(@Param('id', ParseIntPipe) threadId: number) {
  //   return this.threadService.remove(threadId);
  // }
}
