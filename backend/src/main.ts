import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api/v1');
  app.enableCors();

  // Глобальная валидация DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Настройка Swagger документации
  const swaggerConfig = new DocumentBuilder()
    .setTitle('CascadeAuth Engine API')
    .setDescription(
      'Multi-channel OTP Verification & Fallback Cost Optimization API',
    )
    .setVersion('1.0')
    .addTag('Verification & Analytics')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = config.get<number>('PORT', 4000);
  await app.listen(port);

  logger.log(`API Server running at: http://localhost:${port}/api/v1`);
  logger.log(`Swagger Docs available at: http://localhost:${port}/api/docs`);
}
bootstrap();
