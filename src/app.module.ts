import { DatabaseModule } from '@/modules';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import * as morgan from 'morgan';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(morgan('dev')).forRoutes('*');
  }
}
