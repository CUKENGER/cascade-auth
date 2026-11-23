import { Module } from '@nestjs/common';
import { VerificationController } from './verification.controller';
import { EngineModule } from '../engine/engine.module';
import { VerificationService } from './verification.service';
import { ApiKeyGuard } from './api-key.guard';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [EngineModule, PrismaModule],
  controllers: [VerificationController],
  providers: [VerificationService, ApiKeyGuard],
})
export class VerificationModule {}
