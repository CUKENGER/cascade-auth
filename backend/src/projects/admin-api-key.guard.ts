import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class AdminApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const providedKey = request.headers['x-admin-key'];
    const expectedKey = process.env.ADMIN_API_KEY;

    if (!expectedKey) {
      throw new HttpException(
        'ADMIN_API_KEY is not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    if (typeof providedKey !== 'string' || providedKey !== expectedKey) {
      throw new HttpException('Invalid admin API key', HttpStatus.UNAUTHORIZED);
    }

    return true;
  }
}
