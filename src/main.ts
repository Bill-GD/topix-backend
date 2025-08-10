import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import 'dotenv/config';

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
  SwaggerModule.setup('api-docs', app, () =>
    SwaggerModule.createDocument(app, swaggerConfig),
  );

  await app.listen(port);
}

bootstrap();
