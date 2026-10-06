import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class RateLimiterService {
  constructor(private readonly redis: RedisService) {}

  private getPhoneCooldownKey(phone: string): string {
    return `ratelimit:cooldown:${phone}`;
  }

  private getPhoneAttemptLimitKey(phone: string): string {
    return `ratelimit:attempts:${phone}`;
  }

  private getPhoneBlockedKey(phone: string): string {
    return `ratelimit:blocked:${phone}`;
  }

  /**
   * Проверка: разрешено ли запросить новый код для этого телефона
   * @param phone E.164 номер телефона
   * @param minIntervalSec Минимальный интервал между запросами (по умолчанию 30 сек)
   * @param maxRequestsPerHour Максимум запросов в час (по умолчанию 5)
   */
  async assertCanRequestOtp(phone: string, minIntervalSec = 30, maxRequestsPerHour = 5): Promise<void> {
    // 1. Проверяем жесткий бан
    const blockedTtl = await this.redis.ttl(this.getPhoneBlockedKey(phone));
    if (blockedTtl > 0) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'PHONE_BLOCKED',
          message: `Phone is temporarily blocked due to security reasons. Try again in ${blockedTtl} seconds.`,
          retryAfterSec: blockedTtl,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // 2. Проверяем кулдаун между отправками (например, не чаще 1 раза в 30 секунд)
    const cooldownTtl = await this.redis.ttl(this.getPhoneCooldownKey(phone));
    if (cooldownTtl > 0) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'REQUEST_COOLDOWN',
          message: `Please wait ${cooldownTtl} seconds before requesting a new code.`,
          retryAfterSec: cooldownTtl,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // 3. Проверяем часовой лимит
    const hourCount = await this.redis.get(this.getPhoneAttemptLimitKey(phone));
    if (hourCount && parseInt(hourCount, 10) >= maxRequestsPerHour) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'HOURLY_LIMIT_EXCEEDED',
          message: 'Hourly limit for OTP requests reached. Please try again later.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  /**
   * Фиксирует факт отправки кода (взводит кулдаун и обновляет часовой счетчик)
   */
  async registerOtpRequested(phone: string, cooldownSec = 30): Promise<void> {
    const cooldownKey = this.getPhoneCooldownKey(phone);
    await this.redis.set(cooldownKey, '1', cooldownSec);

    const hourKey = this.getPhoneAttemptLimitKey(phone);
    const count = await this.redis.incr(hourKey);
    if (count === 1) {
      await this.redis.expire(hourKey, 3600); // Сбрасываем через 1 час
    }
  }

  /**
   * Временный бан телефона (например, при брутфорсе)
   */
  async blockPhone(phone: string, durationSec = 900): Promise<void> {
    const key = this.getPhoneBlockedKey(phone);
    await this.redis.set(key, '1', durationSec);
  }
}
