import { ApiController } from '@/common/decorators';
import { AuthenticatedGuard } from '@/common/guards';
import { ControllerResponse } from '@/common/utils/controller-response';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostService } from './post.service';

@Controller('post')
@UseGuards(AuthenticatedGuard)
@ApiController()
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  @ApiController('application/x-www-form-urlencoded')
  async create(@Body() dto: CreatePostDto) {
    const res = await this.postService.create(dto);

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
  findOne(@Param('id') id: string) {
    return this.postService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePostDto) {
    return this.postService.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.postService.remove(+id);
  }
}
