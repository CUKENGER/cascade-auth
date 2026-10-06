import { Controller, Post, Get, Body, Param, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EngineService } from '../engine/engine.service';
import { PrismaService } from '../prisma/prisma.service';
import { StartVerificationDto } from './dto/start-verification.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';

@ApiTags('Verification & Analytics')
@Controller('verify')
export class VerificationController {
  constructor(
    private readonly engineService: EngineService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('start')
  @ApiOperation({ summary: 'Инициировать сессию OTP-верификации' })
  @ApiResponse({ status: 201, description: 'Сессия создана, первый шаг каскада запущен' })
  async start(@Body() dto: StartVerificationDto) {
    let projectId = dto.projectId;
    if (!projectId) {
      const defaultProject = await this.prisma.project.findFirst();
      if (!defaultProject) {
        throw new NotFoundException('No default project configured. Please run db seed.');
      }
      projectId = defaultProject.id;
    }

    return this.engineService.startVerification(dto.phone, projectId, dto.cascadeId);
  }

  @Post('confirm')
  @ApiOperation({ summary: 'Подтвердить OTP код' })
  @ApiResponse({ status: 200, description: 'Код подтвержден успешно' })
  async confirm(@Body() dto: VerifyCodeDto) {
    return this.engineService.verifyCode(dto.sessionId, dto.code);
  }

  @Get('session/:id')
  @ApiOperation({ summary: 'Получить состояние сессии и таймлайн попыток доставки' })
  async getSessionStatus(@Param('id') id: string) {
    const session = await this.prisma.verificationSession.findUnique({
      where: { id },
      include: {
        deliveryAttempts: {
          orderBy: { createdAt: 'asc' },
        },
        cascade: {
          include: { steps: { orderBy: { stepOrder: 'asc' } } },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return {
      id: session.id,
      phone: session.phone,
      status: session.status,
      currentStepIndex: session.currentStepIndex,
      attemptsCount: session.attemptsCount,
      expiresAt: session.expiresAt,
      verifiedAt: session.verifiedAt,
      cascade: {
        name: session.cascade.name,
        steps: session.cascade.steps,
      },
      timeline: session.deliveryAttempts,
    };
  }

  @Get('analytics/summary')
  @ApiOperation({ summary: 'Сводные метрики экономии и конверсии' })
  async getAnalyticsSummary() {
    const totalSessions = await this.prisma.verificationSession.count();
    const verifiedSessions = await this.prisma.verificationSession.count({
      where: { status: 'VERIFIED' },
    });

    const attempts = await this.prisma.deliveryAttempt.findMany({
      where: { status: 'DELIVERED' },
    });

    // Расчет расходов и потенциальной экономии (SMS базово считаем по $0.045)
    const SMS_BENCHMARK_COST = 0.045;
    let actualTotalCost = 0;
    let fallbackToSmsAvoidedCount = 0;

    for (const attempt of attempts) {
      const cost = Number(attempt.costUsd);
      actualTotalCost += cost;
      if (attempt.channel === 'TELEGRAM' || attempt.channel === 'FLASH_CALL') {
        fallbackToSmsAvoidedCount++;
      }
    }

    const baselineSmsCost = attempts.length * SMS_BENCHMARK_COST;
    const totalSavedUsd = Math.max(0, baselineSmsCost - actualTotalCost);

    return {
      totalSessions,
      verifiedSessions,
      conversionRate: totalSessions > 0 ? Number(((verifiedSessions / totalSessions) * 100).toFixed(1)) : 0,
      actualCostUsd: Number(actualTotalCost.toFixed(4)),
      baselineCostUsd: Number(baselineSmsCost.toFixed(4)),
      totalSavedUsd: Number(totalSavedUsd.toFixed(4)),
      totalAttemptsCount: attempts.length,
      fallbackToSmsAvoidedCount,
    };
  }
}
