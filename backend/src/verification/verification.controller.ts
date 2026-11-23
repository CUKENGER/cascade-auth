import {
  Controller,
  Get,
  Param,
  HttpException,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiHeader } from '@nestjs/swagger';
import { VerificationService } from './verification.service';
import { ApiKeyGuard } from './api-key.guard';

@ApiTags('Verification & Analytics')
@Controller('verify')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Get('start/:phoneNumber')
  @UseGuards(ApiKeyGuard)
  @ApiHeader({ name: 'x-api-key', required: true })
  @ApiOperation({ summary: 'Получить шаг для указанного номера' })
  @ApiParam({
    name: 'phoneNumber',
    description: 'Международный номер телефона, например +79991234567',
  })
  async getStepByNumber(
    @Param('phoneNumber') phoneNumber: string,
    @Req() request: { projectId: string },
  ) {
    if (!phoneNumber.startsWith('+')) {
      throw new HttpException(
        'Phone number must be in international format and start with "+"',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.verificationService.getStepByNumber(
      phoneNumber,
      request.projectId,
    );
  }
}
