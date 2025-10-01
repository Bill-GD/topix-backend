import { FileModule } from '@/modules/file/file.module';
import { PostModule } from '@/modules/post/post.module';
import { ThreadModule } from '@/modules/thread/thread.module';
import { Module } from '@nestjs/common';
import { GroupController } from './group.controller';
import { GroupService } from './group.service';

@Module({
  controllers: [GroupController],
  providers: [GroupService],
  imports: [PostModule, ThreadModule, FileModule],
})
export class GroupModule {}
