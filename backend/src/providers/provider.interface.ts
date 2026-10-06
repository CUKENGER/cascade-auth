export enum ChannelType {
  TELEGRAM = 'TELEGRAM',
  FLASH_CALL = 'FLASH_CALL',
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
}

export interface SendOtpPayload {
  phone: string;
  code: string;
  metadata?: Record<string, any>;
}

export interface ProviderSendResult {
  success: boolean;
  channel: ChannelType;
  providerName: string;
  providerMessageId?: string;
  costUsd: number;
  errorMessage?: string;
}

export interface IOtpProvider {
  readonly channel: ChannelType;
  readonly name: string;
  sendOtp(payload: SendOtpPayload): Promise<ProviderSendResult>;
}
