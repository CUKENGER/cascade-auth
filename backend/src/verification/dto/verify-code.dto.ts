import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyCodeDto {
  @ApiProperty({
    description: 'UUID сессии верификации',
    example: 'd9b2d63d-a602-46a2-9842-bc0822da8921',
  })
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({
    description: 'Введенный 6-значный OTP код',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  @Length(4, 8, { message: 'Код должен содержать от 4 до 8 символов' })
  code: string;
}
