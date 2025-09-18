import { ApiController, RequesterID } from '@/common/decorators';
import {
  AuthenticatedGuard,
  GetRequesterGuard,
  PostExistGuard,
} from '@/common/guards';
import { ControllerResponse } from '@/common/utils/controller-response';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { ReactDto } from './dto/react.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostService } from './post.service';

@Controller('post')
@UseGuards(AuthenticatedGuard)
@ApiController()
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  @UseGuards(GetRequesterGuard)
  @ApiController('application/x-www-form-urlencoded')
  async create(@RequesterID() requesterId: number, @Body() dto: CreatePostDto) {
    const res = await this.postService.create(requesterId, dto);

    if (!res.success) {
      throw new BadRequestException(res.message);
    }

    return ControllerResponse.ok(res.message, res.data, HttpStatus.CREATED);
  }

  @Get()
  findAll() {
    return this.postService.findAll();
  }

  @Get(':id')
  @UseGuards(PostExistGuard, GetRequesterGuard)
  async findOne(
    @Param('id', ParseIntPipe) postId: number,
    @RequesterID() requesterId: number,
  ) {
    const res = await this.postService.findOne(postId, requesterId);
    if (!res.success) {
      throw new NotFoundException(res.message);
    }
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }

  @Patch(':id')
  @UseGuards(PostExistGuard)
  update(@Param('id') postId: string, @Body() dto: UpdatePostDto) {
    return this.postService.update(+postId, dto);
  }

  @Delete(':id')
  @UseGuards(PostExistGuard)
  remove(@Param('id') postId: string) {
    return this.postService.remove(+postId);
  }

  @Patch(':id/react')
  @UseGuards(PostExistGuard, GetRequesterGuard)
  async react(
    @Param('id', ParseIntPipe) postId: number,
    @RequesterID() requesterId: number,
    @Body() dto: ReactDto,
  ) {
    const res = await this.postService.updateReaction(postId, requesterId, dto);
    if (!res.success) {
      throw new BadRequestException(res.message);
    }
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }

  @Delete(':id/react')
  @UseGuards(PostExistGuard, GetRequesterGuard)
  async removeReaction(
    @Param('id', ParseIntPipe) postId: number,
    @RequesterID() requesterId: number,
  ) {
    const res = await this.postService.removeReaction(postId, requesterId);
    if (!res.success) {
      throw new BadRequestException(res.message);
    }
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }

  @Get(':id/replies')
  @UseGuards(PostExistGuard, GetRequesterGuard)
  async getPostReplies(
    @Param('id', ParseIntPipe) postId: number,
    @RequesterID() requesterId: number,
  ) {
    const res = await this.postService.getPostReplies(postId, requesterId);
    if (!res.success) {
      throw new BadRequestException(res.message);
    }
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }

  @Post(':id/reply')
  @UseGuards(PostExistGuard, GetRequesterGuard)
  async reply(
    @Param('id', ParseIntPipe) postId: number,
    @RequesterID() requesterId: number,
    @Body() dto: CreatePostDto,
  ) {
    const res = await this.postService.reply(postId, requesterId, dto);
    if (!res.success) {
      throw new BadRequestException(res.message);
    }
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }
}
