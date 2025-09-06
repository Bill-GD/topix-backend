import { AuthModule } from '@/modules/auth/auth.module';
import { CryptoModule } from '@/modules/crypto/crypto.module';
import { DatabaseModule } from '@/modules/database.module';
import { MailerModule } from '@/modules/mailer/mailer.module';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import * as morgan from 'morgan';
import * as process from 'node:process';

@Module({
  controllers: [],
  imports: [
    JwtModule.register({
      global: true,
      secret: `${process.env.JWT_SECRET}`,
    }),
    DatabaseModule,
    AuthModule,
    MailerModule,
    CryptoModule,
  ],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(morgan('dev')).forRoutes('*');
  }
}
