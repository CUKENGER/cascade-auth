import { Injectable, Logger } from '@nestjs/common';
import {
  ChannelType,
  IOtpProvider,
  ProviderSendResult,
  SendOtpPayload,
} from './provider.interface';

@Injectable()
export class MockTelegramProvider implements IOtpProvider {
  readonly channel = ChannelType.TELEGRAM;
  readonly name = 'mock-telegram';
  private readonly logger = new Logger(MockTelegramProvider.name);

  async sendOtp(payload: SendOtpPayload): Promise<ProviderSendResult> {
    this.logger.log(
      `[TELEGRAM MOCK] Sent OTP ${payload.code} to ${payload.phone} (Cost: $0.0000)`,
    );
    return {
      success: true,
      channel: this.channel,
      providerName: this.name,
      providerMessageId: `tg_${Date.now()}`,
      costUsd: 0.0, // Бесплатный канал
    };
  }
}

@Injectable()
export class MockFlashCallProvider implements IOtpProvider {
  readonly channel = ChannelType.FLASH_CALL;
  readonly name = 'mock-flash-call';
  private readonly logger = new Logger(MockFlashCallProvider.name);

  async sendOtp(payload: SendOtpPayload): Promise<ProviderSendResult> {
    this.logger.log(
      `[FLASH-CALL MOCK] Calling ${payload.phone}, last 4 digits are ${payload.code} (Cost: $0.0050)`,
    );
    return {
      success: true,
      channel: this.channel,
      providerName: this.name,
      providerMessageId: `fc_${Date.now()}`,
      costUsd: 0.005, // Дешевый канал
    };
  }
}

@Injectable()
export class MockSmsProvider implements IOtpProvider {
  readonly channel = ChannelType.SMS;
  readonly name = 'mock-sms';
  private readonly logger = new Logger(MockSmsProvider.name);

  async sendOtp(payload: SendOtpPayload): Promise<ProviderSendResult> {
    this.logger.log(
      `[SMS MOCK] Sending expensive SMS to ${payload.phone}: code ${payload.code} (Cost: $0.0450)`,
    );
    return {
      success: true,
      channel: this.channel,
      providerName: this.name,
      providerMessageId: `sms_${Date.now()}`,
      costUsd: 0.045, // Дорогой канал (Tier-1 SMS)
    };
  }
}
