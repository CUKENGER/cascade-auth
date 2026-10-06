import { Module } from '@nestjs/common';
import { VerificationController } from './verification.controller';
import { EngineModule } from '../engine/engine.module';

@Module({
  imports: [EngineModule],
  controllers: [VerificationController],
})
export class VerificationModule {}
