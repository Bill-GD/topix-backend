import { FileModule } from '@/modules/file/file.module';
import { PostModule } from '@/modules/post/post.module';
import { Module } from '@nestjs/common';
import { ThreadController } from './thread.controller';
import { ThreadService } from './thread.service';

@Module({
  controllers: [ThreadController],
  providers: [ThreadService],
  imports: [PostModule, FileModule],
  exports: [ThreadService],
})
export class ThreadModule {}
