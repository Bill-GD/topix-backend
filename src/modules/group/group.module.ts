import { FileModule } from '@/modules/file/file.module';
import { ThreadModule } from '@/modules/thread/thread.module';
import { Module } from '@nestjs/common';
import { GroupController } from './group.controller';
import { GroupService } from './group.service';

@Module({
  controllers: [GroupController],
  providers: [GroupService],
  imports: [ThreadModule, FileModule],
})
export class GroupModule {}
