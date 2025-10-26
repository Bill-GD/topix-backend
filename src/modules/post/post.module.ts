import { NotificationModule } from '@/modules/notification/notification.module';
import { Module } from '@nestjs/common';
import { PostController } from './post.controller';
import { PostService } from './post.service';

@Module({
  controllers: [PostController],
  providers: [PostService],
  exports: [PostService],
  imports: [NotificationModule],
})
export class PostModule {}
