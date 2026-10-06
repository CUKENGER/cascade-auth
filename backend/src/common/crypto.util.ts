import * as crypto from 'crypto';

export class CryptoUtil {
  /**
   * Генерация безопасного числового OTP кода
   */
  static generateOtpCode(length = 6): string {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return crypto.randomInt(min, max + 1).toString();
  }

  /**
   * SHA-256 хеш кода для безопасного хранения в БД
   */
  static hashOtpCode(code: string): string {
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  /**
   * Проверка совпадения кода с хешем
   */
  static verifyOtpCode(inputCode: string, hashedCode: string): boolean {
    const inputHash = this.hashOtpCode(inputCode);
    return crypto.timingSafeEqual(
      Buffer.from(inputHash),
      Buffer.from(hashedCode),
    );
  }
}
