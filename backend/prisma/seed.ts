import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, ChannelType, UserRole } from '@prisma/client';
import { hash } from 'bcryptjs';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding initial project and default cascade...');

  const adminEmail = process.env.PLATFORM_ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.PLATFORM_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error(
      'PLATFORM_ADMIN_EMAIL and PLATFORM_ADMIN_PASSWORD are required',
    );
  }

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: await hash(adminPassword, 12),
        role: UserRole.PLATFORM_ADMIN,
      },
    });

    console.log(`Created platform admin: ${adminEmail}`);
  } else if (existingAdmin.role !== UserRole.PLATFORM_ADMIN) {
    throw new Error(
      `Account ${adminEmail} exists but is not a platform admin; promote it deliberately`,
    );
  } else {
    console.log(`Platform admin already exists: ${adminEmail}`);
  }

  // 1. Создаем дефолтный проект
  const project = await prisma.project.upsert({
    where: { id: 'proj_default' },
    update: {},
    create: {
      id: 'proj_default',
      name: 'Production Fintech Demo',
    },
  });

  // 2. Создаем дефолтный каскад: Telegram (45s) -> Flash-Call (30s) -> SMS
  const cascade = await prisma.cascade.upsert({
    where: { id: 'casc_tier1_default' },
    update: {},
    create: {
      id: 'casc_tier1_default',
      projectId: project.id,
      name: 'Tier-1 Smart Fallback (Max Savings)',
      isDefault: true,
      steps: {
        create: [
          {
            stepOrder: 0,
            channel: ChannelType.TELEGRAM,
            timeoutSeconds: 45,
            providerName: 'mock-telegram',
          },
          {
            stepOrder: 1,
            channel: ChannelType.FLASH_CALL,
            timeoutSeconds: 30,
            providerName: 'mock-flash-call',
          },
          {
            stepOrder: 2,
            channel: ChannelType.SMS,
            timeoutSeconds: 60,
            providerName: 'mock-sms',
          },
        ],
      },
    },
  });

  console.log(`Seeded Project: ${project.name} (${project.id})`);
  console.log(`Seeded Cascade: ${cascade.name} (${cascade.id}) with 3 steps.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
