import { DatabaseModule } from '@/modules';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import * as morgan from 'morgan';

@Module({
  imports: [DatabaseModule],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(morgan('dev')).forRoutes('*');
  }
}
