import { FileModule } from '@/modules/file/file.module';
import { Module } from '@nestjs/common';
import { PostController } from './post.controller';
import { PostService } from './post.service';

@Module({
  controllers: [PostController],
  providers: [PostService],
  exports: [PostService],
  imports: [FileModule],
})
export class PostModule {}
