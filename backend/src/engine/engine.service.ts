import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { ProviderFactory } from '../providers/provider.factory';
import { RateLimiterService } from '../security/rate-limiter.service';
import { CryptoUtil } from '../common/crypto.util';
import { OTP_CASCADE_QUEUE, JOB_FALLBACK_TIMEOUT } from './engine.constants';
import { SessionStatus, StepDeliveryStatus } from '@prisma/client';

@Injectable()
export class EngineService {
  private readonly logger = new Logger(EngineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly providerFactory: ProviderFactory,
    private readonly rateLimiter: RateLimiterService,
    @InjectQueue(OTP_CASCADE_QUEUE) private readonly cascadeQueue: Queue,
  ) {}

  /**
   * Старт сессии верификации
   */
  async startVerification(
    phone: string,
    projectId: string,
    cascadeId?: string,
  ) {
    // 1. Проверяем лимиты и блокировки
    await this.rateLimiter.assertCanRequestOtp(phone);

    // 2. Ищем проект и каскад
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        cascades: {
          include: { steps: { orderBy: { stepOrder: 'asc' } } },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    const cascade = cascadeId
      ? project.cascades.find((c) => c.id === cascadeId)
      : project.cascades.find((c) => c.isDefault) || project.cascades[0];

    if (!cascade || cascade.steps.length === 0) {
      throw new BadRequestException(
        'No active cascade or steps configured for this project',
      );
    }

    // 3. Генерируем код (храним только хеш)
    const rawOtp = CryptoUtil.generateOtpCode(6);
    const hashedCode = CryptoUtil.hashOtpCode(rawOtp);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 минут жизни сессии

    // 4. Создаем сессию в PostgreSQL
    const session = await this.prisma.verificationSession.create({
      data: {
        projectId: project.id,
        cascadeId: cascade.id,
        phone,
        hashedCode,
        currentStepIndex: 0,
        expiresAt,
        status: SessionStatus.PENDING,
      },
    });

    // 5. Регистрируем факт запроса в RateLimiter
    await this.rateLimiter.registerOtpRequested(phone);

    // 6. Запускаем первый шаг каскада
    await this.executeStep(session.id, cascade.id, 0, rawOtp);

    return {
      sessionId: session.id,
      phone: session.phone,
      status: session.status,
      expiresAt: session.expiresAt,
      // В режиме разработки отдаем код для быстрого тестирования в Swagger/Postman
      ...(process.env.NODE_ENV !== 'production' && { devOtpCode: rawOtp }),
    };
  }

  /**
   * Выполнение конкретного шага каскада
   */
  async executeStep(
    sessionId: string,
    cascadeId: string,
    stepIndex: number,
    cachedOtp?: string,
  ): Promise<void> {
    const session = await this.prisma.verificationSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.status !== SessionStatus.PENDING) {
      this.logger.debug(
        `Session ${sessionId} is no longer pending. Skipping step ${stepIndex}.`,
      );
      return;
    }

    const step = await this.prisma.cascadeStep.findUnique({
      where: {
        cascadeId_stepOrder: {
          cascadeId,
          stepOrder: stepIndex,
        },
      },
    });

    if (!step) {
      // Шаги закончились, а код так и не ввели
      this.logger.warn(
        `All cascade steps exhausted for session ${sessionId}. Marking as EXPIRED.`,
      );
      await this.prisma.verificationSession.update({
        where: { id: sessionId },
        data: { status: SessionStatus.EXPIRED },
      });
      return;
    }

    // Обновляем текущий индекс шага в сессии
    await this.prisma.verificationSession.update({
      where: { id: sessionId },
      data: { currentStepIndex: stepIndex },
    });

    const provider = this.providerFactory.getProvider(step.channel as any);

    // Отправляем код через провайдер
    const result = await provider.sendOtp({
      phone: session.phone,
      code: cachedOtp || '******', // В реальном проде можно использовать SMS template
    });

    // Фиксируем попытку отправки в аудит-логе
    await this.prisma.deliveryAttempt.create({
      data: {
        sessionId: session.id,
        stepOrder: step.stepOrder,
        channel: step.channel,
        provider: result.providerName,
        costUsd: result.costUsd,
        status: result.success
          ? StepDeliveryStatus.DELIVERED
          : StepDeliveryStatus.FAILED,
        providerMessageId: result.providerMessageId,
        errorMessage: result.errorMessage,
      },
    });

    if (result.success) {
      // Планируем проверку фоллбэка через BullMQ
      await this.cascadeQueue.add(
        JOB_FALLBACK_TIMEOUT,
        { sessionId: session.id, cascadeId, stepIndex },
        {
          delay: step.timeoutSeconds * 1000,
          jobId: `timeout:${session.id}:${stepIndex}`,
          removeOnComplete: true,
        },
      );
    } else {
      // Если отправка упала с сетевой ошибкой сразу — не ждем таймаут, идем к следующему шагу
      this.logger.warn(
        `Step ${stepIndex} failed immediately. Escalating to next step...`,
      );
      await this.executeStep(sessionId, cascadeId, stepIndex + 1, cachedOtp);
    }
  }

  /**
   * Подтверждение OTP кода пользователем
   */
  async verifyCode(sessionId: string, code: string) {
    const session = await this.prisma.verificationSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Verification session not found');
    }

    if (session.status !== SessionStatus.PENDING) {
      throw new BadRequestException(
        `Session is not active (current status: ${session.status})`,
      );
    }

    if (new Date() > session.expiresAt) {
      await this.prisma.verificationSession.update({
        where: { id: sessionId },
        data: { status: SessionStatus.EXPIRED },
      });
      throw new BadRequestException('Verification code has expired');
    }

    // Проверяем валидность кода
    const isValid = CryptoUtil.verifyOtpCode(code, session.hashedCode);

    if (!isValid) {
      const nextAttempts = session.attemptsCount + 1;

      if (nextAttempts >= session.maxAttempts) {
        // Блокируем сессию и номер телефона
        await this.prisma.verificationSession.update({
          where: { id: sessionId },
          data: { attemptsCount: nextAttempts, status: SessionStatus.BLOCKED },
        });
        await this.rateLimiter.blockPhone(session.phone, 900); // Бан на 15 минут

        throw new BadRequestException(
          'Maximum verification attempts exceeded. Phone is blocked.',
        );
      }

      await this.prisma.verificationSession.update({
        where: { id: sessionId },
        data: { attemptsCount: nextAttempts },
      });

      throw new BadRequestException(
        `Invalid verification code. Attempts left: ${session.maxAttempts - nextAttempts}`,
      );
    }

    // Код верный!
    const verifiedSession = await this.prisma.verificationSession.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.VERIFIED,
        verifiedAt: new Date(),
      },
    });

    return {
      success: true,
      sessionId: verifiedSession.id,
      phone: verifiedSession.phone,
      verifiedAt: verifiedSession.verifiedAt,
    };
  }
}
