import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';

export type AuthenticatedRequest = Request & {
  user: {
    id: string;
    email: string;
    role: string;
  };
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const authorization = request.headers.authorization;
    const [scheme, token] = authorization?.split(' ') ?? [];

    if (scheme !== 'Bearer' || !token) {
      throw new HttpException('Missing bearer token', HttpStatus.UNAUTHORIZED);
    }

    let payload: { sub?: string };

    try {
      payload = await this.jwtService.verifyAsync(token);
    } catch {
      throw new HttpException('Invalid bearer token', HttpStatus.UNAUTHORIZED);
    }

    if (!payload.sub) {
      throw new HttpException('Invalid bearer token', HttpStatus.UNAUTHORIZED);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.UNAUTHORIZED);
    }

    request.user = user;
    return true;
  }
}
