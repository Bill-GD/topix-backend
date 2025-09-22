import { FileModule } from '@/modules/file/file.module';
import { Module } from '@nestjs/common';
import { ThreadService } from './thread.service';
import { ThreadController } from './thread.controller';

@Module({
  controllers: [ThreadController],
  providers: [ThreadService],
  imports: [FileModule],
})
export class ThreadModule {}
