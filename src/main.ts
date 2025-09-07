import 'dotenv/config';
import { CatchEverythingFilter } from '@/common/filters';
import { ResponseStatusInterceptor } from '@/common/interceptors/response-status.interceptor';
import { ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const port = process.env.PORT ?? 3000;
  console.log(`[Server]\tLocal: http://localhost:${port}/`);

  const app = await NestFactory.create(AppModule, {
    cors: { origin: [`http://localhost:${process.env.CLIENT_PORT}`] },
  });

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

  app.useGlobalFilters(new CatchEverythingFilter(app.get(HttpAdapterHost)));
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useGlobalInterceptors(new ResponseStatusInterceptor());

  await app.listen(port);
}

bootstrap();
