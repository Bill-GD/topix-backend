import { PostModule } from '@/modules/post/post.module';
import { Module } from '@nestjs/common';
import { ThreadController } from './thread.controller';
import { ThreadService } from './thread.service';

@Module({
  controllers: [ThreadController],
  providers: [ThreadService],
  imports: [PostModule],
  exports: [ThreadService],
})
export class ThreadModule {}
