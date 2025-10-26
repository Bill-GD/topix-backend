import { NotificationModule } from '@/modules/notification/notification.module';
import { UserController } from '@/modules/user/user.controller';
import { UserService } from '@/modules/user/user.service';
import { Module } from '@nestjs/common';

@Module({
  controllers: [UserController],
  providers: [UserService],
  imports: [NotificationModule],
})
export class UserModule {}
