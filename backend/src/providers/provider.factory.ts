import { Injectable, NotFoundException } from '@nestjs/common';
import { ChannelType, IOtpProvider } from './provider.interface';
import { MockTelegramProvider, MockFlashCallProvider, MockSmsProvider } from './mock.provider';

@Injectable()
export class ProviderFactory {
  private readonly providers = new Map<ChannelType, IOtpProvider>();

  constructor(
    telegramProvider: MockTelegramProvider,
    flashCallProvider: MockFlashCallProvider,
    smsProvider: MockSmsProvider,
  ) {
    this.providers.set(ChannelType.TELEGRAM, telegramProvider);
    this.providers.set(ChannelType.FLASH_CALL, flashCallProvider);
    this.providers.set(ChannelType.SMS, smsProvider);
  }

  getProvider(channel: ChannelType): IOtpProvider {
    const provider = this.providers.get(channel);
    if (!provider) {
      throw new NotFoundException(`No provider registered for channel: ${channel}`);
    }
    return provider;
  }
}
