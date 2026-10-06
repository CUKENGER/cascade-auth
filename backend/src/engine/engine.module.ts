import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { OTP_CASCADE_QUEUE } from './engine.constants';
import { EngineService } from './engine.service';
import { EngineProcessor } from './engine.processor';
import { ProvidersModule } from '../providers/providers.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: OTP_CASCADE_QUEUE,
    }),
    ProvidersModule,
  ],
  providers: [EngineService, EngineProcessor],
  exports: [EngineService],
})
export class EngineModule {}
