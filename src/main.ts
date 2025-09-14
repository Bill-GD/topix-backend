import 'dotenv/config';
import { CatchEverythingFilter } from '@/common/filters';
import { ResponseInterceptor } from '@/common/interceptors';
import { ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { v2 as cloudinary } from 'cloudinary';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const port = process.env.PORT ?? 3000;
  console.log(`[Server]\tLocal: http://localhost:${port}/`);

  const app = await NestFactory.create(AppModule);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('topix API')
    .setDescription(
      'The API server for ' +
        '<b><a target="_blank" href="https://github.com/Bill-GD/topix">topix</a></b>',
    )
    .setVersion(process.env.npm_package_version ?? '0.0.1')
    .build();

  SwaggerModule.setup(
    'api-docs',
    app,
    SwaggerModule.createDocument(app, swaggerConfig),
    {
      swaggerOptions: {
        defaultModelsExpandDepth: -1,
      },
    },
  );

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  app.enableCors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  });
  app.use(cookieParser());

  app.useGlobalFilters(new CatchEverythingFilter(app.get(HttpAdapterHost)));
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.useGlobalInterceptors(new ResponseInterceptor());

  await app.listen(port);
}

bootstrap();
