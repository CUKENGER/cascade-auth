import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class StartVerificationDto {
  @ApiProperty({
    example: '+12025550199',
    description: 'Номер телефона в международном формате E.164',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message:
      'Телефон должен соответствовать формату E.164 (например, +12025550199)',
  })
  phone: string;

  @ApiPropertyOptional({
    example: 'proj_default',
    description: 'ID проекта (если не передан — используется дефолтный)',
  })
  @IsString()
  @IsOptional()
  projectId?: string;

  @ApiPropertyOptional({
    description:
      'ID конкретного каскада (если не передан — берется дефолтный каскад проекта)',
  })
  @IsString()
  @IsOptional()
  cascadeId?: string;
}
