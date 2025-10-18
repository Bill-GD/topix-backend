import { ApiController, ApiFile, RequesterID } from '@/common/decorators';
import {
  AuthenticatedGuard,
  GetRequesterGuard,
  PostExistGuard,
  PostOwnerGuard,
  PostOwnerOrAdminGuard,
} from '@/common/guards';
import { FileSizeValidatorPipe } from '@/common/pipes';
import { PostQuery } from '@/common/queries';
import { ControllerResponse } from '@/common/utils/controller-response';
import { addPaginateHeader } from '@/common/utils/helpers';
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
@UseGuards(AuthenticatedGuard)
@ApiController()
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  @UseGuards(GetRequesterGuard)
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
    if (files) dto.fileObjects = files;
    const res = await this.postService.create(requesterId, dto);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.CREATED);
  }

  @Get()
  @UseGuards(GetRequesterGuard)
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
  @UseGuards(GetRequesterGuard)
  async getAllFollowing(
    @Res({ passthrough: true }) response: Response,
    @Query() query: PostQuery,
    @RequesterID() requesterId: number,
  ) {
    const res = await this.postService.getAllFollowing(query, requesterId);
    addPaginateHeader(response, res.data.length < query.size);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }

  @Get(':id')
  @UseGuards(PostExistGuard, GetRequesterGuard)
  async getOne(
    @Param('id', ParseIntPipe) postId: number,
    @RequesterID() requesterId: number,
  ) {
    const res = await this.postService.getOne(postId, requesterId);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }

  @Patch(':id')
  @UseGuards(PostExistGuard, GetRequesterGuard, PostOwnerGuard)
  async update(
    @Param('id', ParseIntPipe) postId: number,
    @Body() dto: UpdatePostDto,
  ) {
    const res = await this.postService.update(postId, dto);
    return ControllerResponse.ok(res.message, null, HttpStatus.OK);
  }

  @Delete(':id')
  @UseGuards(PostExistGuard, GetRequesterGuard, PostOwnerOrAdminGuard)
  async remove(@Param('id', ParseIntPipe) postId: number) {
    const res = await this.postService.remove(postId);
    return ControllerResponse.ok(res.message, null, HttpStatus.OK);
  }

  @Patch(':id/react')
  @UseGuards(PostExistGuard, GetRequesterGuard)
  async react(
    @Param('id', ParseIntPipe) postId: number,
    @RequesterID() requesterId: number,
    @Body() dto: ReactDto,
  ) {
    const res = await this.postService.updateReaction(postId, requesterId, dto);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }

  @Delete(':id/react')
  @UseGuards(PostExistGuard, GetRequesterGuard)
  async removeReaction(
    @Param('id', ParseIntPipe) postId: number,
    @RequesterID() requesterId: number,
  ) {
    const res = await this.postService.removeReaction(postId, requesterId);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }

  @Post(':id/reply')
  @UseGuards(PostExistGuard, GetRequesterGuard)
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
    if (files) dto.fileObjects = files;
    const res = await this.postService.reply(postId, requesterId, dto);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }
}
