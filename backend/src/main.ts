import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './shared/AllExceptionsFilter';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WinstonLogger } from './shared/infrastructure/services';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true,
  });

  app.useLogger(app.get(WinstonLogger));

  const config = new DocumentBuilder()
    .setTitle('Web2 errors login API')
    .setDescription(
      'This is a scaffold of an api that allows login using errors and errors',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.setBaseViewsDir(
    join(__dirname, '../src/shared/infrastructure/views/public'),
  );
  app.setViewEngine('hbs');

  await app.listen(3000);
}

bootstrap();
