import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { OTP_CASCADE_QUEUE, JOB_FALLBACK_TIMEOUT } from './engine.constants';
import { EngineService } from './engine.service';
import { PrismaService } from '../prisma/prisma.service';
import { SessionStatus } from '@prisma/client';

@Processor(OTP_CASCADE_QUEUE)
export class EngineProcessor extends WorkerHost {
  private readonly logger = new Logger(EngineProcessor.name);

  constructor(
    private readonly engineService: EngineService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<{ sessionId: string; cascadeId: string; stepIndex: number }>): Promise<void> {
    if (job.name === JOB_FALLBACK_TIMEOUT) {
      const { sessionId, cascadeId, stepIndex } = job.data;
      this.logger.log(`Evaluating timeout fallback for session: ${sessionId}, step: ${stepIndex}`);

      const session = await this.prisma.verificationSession.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        return;
      }

      // Если пользователь уже ввел код или сессия закрыта — ничего не делаем
      if (session.status !== SessionStatus.PENDING) {
        this.logger.debug(`Session ${sessionId} is ${session.status}. No fallback needed.`);
        return;
      }

      // Если сессия все еще на этом же шаге — значит за таймаут код не подтвердили
      if (session.currentStepIndex === stepIndex) {
        this.logger.log(`Timeout reached for step ${stepIndex}. Advancing to step ${stepIndex + 1}...`);
        await this.engineService.executeStep(sessionId, cascadeId, stepIndex + 1);
      }
    }
  }
}
