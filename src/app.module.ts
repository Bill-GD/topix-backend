import { DatabaseModule } from '@/modules/database.module';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import * as morgan from 'morgan';

@Module({
  controllers: [],
  imports: [DatabaseModule, AuthModule],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(morgan('dev')).forRoutes('*');
  }
}
