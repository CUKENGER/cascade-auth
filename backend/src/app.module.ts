import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import * as Joi from 'joi';
import { PrismaModule } from './prisma/prisma.module';
import { ProvidersModule } from './providers/providers.module';
import { RedisModule } from './redis/redis.module';
import { SecurityModule } from './security/security.module';
import { EngineModule } from './engine/engine.module';
import { VerificationModule } from './verification/verification.module';
import { ProjectsModule } from './projects/projects.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../.env'],
      validationSchema: Joi.object({
        PORT: Joi.number().port().default(4000),
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),

        DATABASE_URL: Joi.string().required(),

        REDIS_HOST: Joi.string().required(),
        REDIS_PORT: Joi.number().port().required(),
        REDIS_PASSWORD: Joi.string().required(),
        ADMIN_API_KEY: Joi.string().min(32).required(),
        PLATFORM_ADMIN_EMAIL: Joi.string().email().required(),
        PLATFORM_ADMIN_PASSWORD: Joi.string().min(12).required(),
      }),
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.getOrThrow<string>('REDIS_HOST'),
          port: config.getOrThrow<number>('REDIS_PORT'),
          password: config.getOrThrow<string>('REDIS_PASSWORD'),
        },
      }),
    }),
    PrismaModule,
    RedisModule,
    SecurityModule,
    ProvidersModule,
    EngineModule,
    VerificationModule,
    ProjectsModule,
    AuthModule,
  ],
})
export class AppModule {}
