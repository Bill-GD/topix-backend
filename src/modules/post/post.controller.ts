import { ApiController } from '@/common/decorators';
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
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
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
  async create(@Req() req: Request, @Body() dto: CreatePostDto) {
    const res = await this.postService.create(req['userId'] as number, dto);

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
    @Req() req: Request,
  ) {
    const res = await this.postService.findOne(postId, req['userId'] as number);
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
    @Body() dto: ReactDto,
    @Req() req: Request,
  ) {
    const res = await this.postService.updateReaction(
      postId,
      req['userId'] as number,
      dto,
    );
    if (!res.success) {
      throw new BadRequestException(res.message);
    }
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }

  @Delete(':id/react')
  @UseGuards(PostExistGuard, GetRequesterGuard)
  async removeReaction(
    @Param('id', ParseIntPipe) postId: number,
    @Req() req: Request,
  ) {
    const res = await this.postService.removeReaction(
      postId,
      req['userId'] as number,
    );
    if (!res.success) {
      throw new BadRequestException(res.message);
    }
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }

  @Get(':id/replies')
  @UseGuards(PostExistGuard, GetRequesterGuard)
  async getPostReplies(
    @Param('id', ParseIntPipe) postId: number,
    @Req() req: Request,
  ) {
    const res = await this.postService.getPostReplies(
      postId,
      req['userId'] as number,
    );
    if (!res.success) {
      throw new BadRequestException(res.message);
    }
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }

  @Post(':id/reply')
  @UseGuards(PostExistGuard, GetRequesterGuard)
  async reply(
    @Param('id', ParseIntPipe) postId: number,
    @Body() dto: CreatePostDto,
    @Req() req: Request,
  ) {
    const res = await this.postService.reply(
      postId,
      req['userId'] as number,
      dto,
    );
    if (!res.success) {
      throw new BadRequestException(res.message);
    }
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }
}
