// PATH: prisma/seed.ts
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Seed Script ---'); // Start marker

  try {
    // --- 1. Create Workstations ---
    console.log('Seeding Workstations...');
    const bar = await prisma.workstation.upsert({
      where: { name: 'BAR' },
      update: {},
      create: { name: 'BAR' },
    });
    console.log('Upserted BAR:', bar.id); // Log success + ID

    const kitchen = await prisma.workstation.upsert({
      where: { name: 'KITCHEN' },
      update: {},
      create: { name: 'KITCHEN' },
    });
    console.log('Upserted KITCHEN:', kitchen.id);

    const coffee = await prisma.workstation.upsert({
      where: { name: 'COFFEE' },
      update: {},
      create: { name: 'COFFEE' },
    });
    console.log('Upserted COFFEE:', coffee.id);

    const expeditor = await prisma.workstation.upsert({
      where: { name: 'EXPEDITOR' },
      update: {},
      create: { name: 'EXPEDITOR' },
    });
    console.log('Upserted EXPEDITOR:', expeditor.id);

    console.log('Workstations seeding completed.');

    // --- 2. Create Default Owner ---
    console.log('Seeding Default Owner...');
    const defaultPin = '123456';
    console.log('Hashing PIN...');
    const hashedPin = await bcrypt.hash(defaultPin, 10);
    console.log('PIN Hashed. HASH:', hashedPin); // Log the hash being used

    const owner = await prisma.user.upsert({
      where: { email: 'owner@venue.com' },
      update: {
        // You might want to update the PIN even if the user exists
        pin: hashedPin,
        isActive: true, // Ensure active on update too
      },
      create: {
        name: 'Default Owner',
        email: 'owner@venue.com',
        pin: hashedPin,
        role: Role.OWNER,
        isActive: true,
      },
    });
    console.log('Upserted Owner:', owner.id, 'Email:', owner.email); // Log success + ID/Email

    console.log('Default owner seeding completed. PIN used: 123456');

  } catch (e) { // Catch any errors during seeding
    console.error('!!! ERROR DURING SEEDING !!!:', e);
    process.exit(1); // Exit with error code if seeding fails
  } finally {
    console.log('Disconnecting Prisma...');
    await prisma.$disconnect();
    console.log('Prisma disconnected.');
  }

  console.log('--- Seed Script Finished Successfully ---'); // Success marker
}

main(); // Execute main function