import { EventService } from '@/modules/notification/event.service';
import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';

@Module({
  controllers: [NotificationController],
  providers: [NotificationService, EventService],
  exports: [NotificationService, EventService],
})
export class NotificationModule {}
