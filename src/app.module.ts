import { DecryptTokenMiddleware } from '@/common/middlewares';
import { AuthModule } from '@/modules/auth/auth.module';
import { CryptoModule } from '@/modules/crypto/crypto.module';
import { DatabaseModule } from '@/modules/database.module';
import { MailerModule } from '@/modules/mailer/mailer.module';
import { UserModule } from '@/modules/user/user.module';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ServeStaticModule } from '@nestjs/serve-static';
import * as morgan from 'morgan';
import * as process from 'node:process';

@Module({
  controllers: [],
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
    }),
    ServeStaticModule.forRoot({
      rootPath: `${__dirname}/../public`,
      serveStaticOptions: {
        fallthrough: false,
      },
    }),
    DatabaseModule,
    MailerModule,
    CryptoModule,
    AuthModule,
    UserModule,
  ],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(morgan('dev')).forRoutes('*');
    consumer.apply(DecryptTokenMiddleware).forRoutes('*');
  }
}
