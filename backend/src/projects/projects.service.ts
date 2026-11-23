import { randomBytes } from 'node:crypto';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectRole, UserRole } from '@prisma/client';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(name: string) {
    const projectName = name?.trim();

    if (!projectName) {
      throw new HttpException(
        'Project name is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const apiKey = `csk_${randomBytes(32).toString('hex')}`;

    return this.prisma.project.create({
      data: {
        name: projectName,
        apiKey,
      },
      select: {
        id: true,
        name: true,
        apiKey: true,
        createdAt: true,
      },
    });
  }

  async findAll() {
    return this.prisma.project.findMany({
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async findAccessibleByUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.UNAUTHORIZED);
    }

    if (user.role === UserRole.PLATFORM_ADMIN) {
      const projects = await this.findAll();

      return projects.map((project) => ({
        ...project,
        role: ProjectRole.ADMIN,
      }));
    }

    const memberships = await this.prisma.projectMember.findMany({
      where: { userId },
      select: {
        role: true,
        project: {
          select: {
            id: true,
            name: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: { project: { name: 'asc' } },
    });

    return memberships.map(({ project, role }) => ({
      ...project,
      role,
    }));
  }

  async findAccessibleById(userId: string, projectId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.UNAUTHORIZED);
    }

    if (user.role === UserRole.PLATFORM_ADMIN) {
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        select: {
          id: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!project) {
        throw new HttpException('Project not found', HttpStatus.NOT_FOUND);
      }

      return { ...project, role: ProjectRole.ADMIN };
    }

    const membership = await this.prisma.projectMember.findUnique({
      where: {
        userId_projectId: { userId, projectId },
      },
      select: {
        role: true,
        project: {
          select: {
            id: true,
            name: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!membership) {
      throw new HttpException('Project not found', HttpStatus.NOT_FOUND);
    }

    return {
      ...membership.project,
      role: membership.role,
    };
  }
}
