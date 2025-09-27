import { FileModule } from '@/modules/file/file.module';
import { UserController } from '@/modules/user/user.controller';
import { UserService } from '@/modules/user/user.service';
import { Module } from '@nestjs/common';

@Module({
  controllers: [UserController],
  providers: [UserService],
  imports: [FileModule],
})
export class UserModule {}
