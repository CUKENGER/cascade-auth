import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminApiKeyGuard } from './admin-api-key.guard';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, AdminApiKeyGuard],
})
export class ProjectsModule {}
