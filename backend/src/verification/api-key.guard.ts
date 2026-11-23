import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type RequestWithProject = {
  headers: Record<string, string | string[] | undefined>;
  projectId?: string;
};

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithProject>();

    const apiKey = request.headers['x-api-key'];

    if (typeof apiKey !== 'string' || !apiKey.trim()) {
      throw new HttpException(
        'Missing x-api-key header',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const project = await this.prisma.project.findUnique({
      where: { apiKey },
      select: { id: true },
    });

    if (!project) {
      throw new HttpException('Invalid API key', HttpStatus.UNAUTHORIZED);
    }

    request.projectId = project.id;
    return true;
  }
}
