import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  app.setGlobalPrefix('api/v1');
  app.enableCors();
  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}/api/v1`);
}

bootstrap();
