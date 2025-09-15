import { PostModule } from '@/modules/post/post.module';
import { UserController } from '@/modules/user/user.controller';
import { UserService } from '@/modules/user/user.service';
import { Module } from '@nestjs/common';

@Module({
  controllers: [UserController],
  providers: [UserService],
  imports: [PostModule],
})
export class UserModule {}
