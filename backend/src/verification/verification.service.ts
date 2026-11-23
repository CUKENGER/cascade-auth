import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import parsePhoneNumberFromString from 'libphonenumber-js/max';
import { SessionStatus } from '@prisma/client';
import { VerificationLookupStatus } from './types/verification-status.emum';

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);
  constructor(private readonly prisma: PrismaService) {}

  async getStepByNumber(phoneNumber: string, projectId: string) {
    const parsedPhone = parsePhoneNumberFromString(phoneNumber, {
      extract: false,
    });

    if (!parsedPhone?.isValid()) {
      throw new HttpException('Invalid phone number', HttpStatus.BAD_REQUEST);
    }
    const phone = parsedPhone.number;

    // Ищем активную попытку этого номера в этом проекте.
    const session = await this.prisma.verificationSession.findFirst({
      where: {
        projectId,
        phone,
        status: SessionStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        cascade: {
          include: {
            steps: { orderBy: { stepOrder: 'asc' } },
          },
        },
      },
    });

    if (session) {
      const currentStep = session.cascade.steps.find(
        (step) => step.stepOrder === session.currentStepIndex,
      );

      if (!currentStep) {
        throw new HttpException('Current step not found', HttpStatus.NOT_FOUND);
      }

      return {
        status: VerificationLookupStatus.IN_PROGRESS,
        verificationId: session.id,
        phoneNumber: phone,
        currentStep: {
          stepOrder: currentStep.stepOrder,
          channel: currentStep.channel,
          timeoutSeconds: currentStep.timeoutSeconds,
        },
      };
    }

    // Активной попытки нет — возвращаем первый шаг каскада проекта.
    const cascade = await this.prisma.cascade.findFirst({
      where: {
        projectId,
        isDefault: true,
      },
      include: {
        steps: { orderBy: { stepOrder: 'asc' } },
      },
    });

    const firstStep = cascade?.steps[0];

    if (!firstStep) {
      throw new HttpException(
        'Default cascade or its first step not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      status: VerificationLookupStatus.READY,
      phoneNumber: phone,
      currentStep: {
        stepOrder: firstStep.stepOrder,
        channel: firstStep.channel,
        timeoutSeconds: firstStep.timeoutSeconds,
      },
    };
  }
}
