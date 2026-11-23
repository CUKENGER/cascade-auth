import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  HttpException,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectsService } from './projects.service';
import type { AuthenticatedRequest } from '../auth/jwt-auth.guard';

@ApiTags('Projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить доступные пользователю компании' })
  getMyProjects(@Req() request: AuthenticatedRequest) {
    return this.projectsService.findAccessibleByUser(request.user.id);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить все компании (только PLATFORM_ADMIN)' })
  getAllProjects(@Req() request: AuthenticatedRequest) {
    if (request.user.role !== UserRole.PLATFORM_ADMIN) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }

    return this.projectsService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить компанию по ID, если есть доступ' })
  getProjectById(
    @Param('id') projectId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.projectsService.findAccessibleById(request.user.id, projectId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Создать компанию (только PLATFORM_ADMIN)' })
  create(@Body('name') name: string, @Req() request: AuthenticatedRequest) {
    if (request.user.role !== UserRole.PLATFORM_ADMIN) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }

    return this.projectsService.create(name);
  }
}
