import { Module } from '@nestjs/common';
import {
  MockTelegramProvider,
  MockFlashCallProvider,
  MockSmsProvider,
} from './mock.provider';
import { ProviderFactory } from './provider.factory';

@Module({
  providers: [
    MockTelegramProvider,
    MockFlashCallProvider,
    MockSmsProvider,
    ProviderFactory,
  ],
  exports: [ProviderFactory],
})
export class ProvidersModule {}
