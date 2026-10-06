import { PrismaClient, ChannelType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial project and default cascade...');

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
