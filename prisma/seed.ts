import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // --- 1. Create Workstations ---
  // These are essential for creating products
  await prisma.workstation.upsert({
    where: { name: 'BAR' },
    update: {},
    create: { name: 'BAR' },
  });

  await prisma.workstation.upsert({
    where: { name: 'KITCHEN' },
    update: {},
    create: { name: 'KITCHEN' },
  });

  await prisma.workstation.upsert({
    where: { name: 'COFFEE' },
    update: {},
    create: { name: 'COFFEE' },
  });

  await prisma.workstation.upsert({
    where: { name: 'EXPEDITOR' },
    update: {},
    create: { name: 'EXPEDITOR' },
  });

  console.log('Workstations seeded.');

  // --- 2. Create Default Owner ---
  // Hashes the default PIN '123456'
  const defaultPin = '123456';
  const hashedPin = await bcrypt.hash(defaultPin, 10);

  await prisma.user.upsert({
    where: { email: 'owner@venue.com' },
    update: {},
    create: {
      name: 'Default Owner',
      email: 'owner@venue.com',
      pin: hashedPin, // Use the hashed pin
      role: Role.OWNER,
      isActive: true,
    },
  });

  console.log('Default owner seeded. PIN: 123456');
  console.log('Seed script finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });