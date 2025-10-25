import { PrismaClient, StaffRole } from '@prisma/client';
import { hash } from 'bcryptjs';

// This script will be run with `npx prisma db seed`
// It creates a default Admin user so you can log in
// and populates the essential 'Environments' table.

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  const defaultPin = '1234';
  const hashedPin = await hash(defaultPin, 12);

  // Create a default admin staff user
  // We use `upsert` to avoid errors if you run `db seed` multiple times.
  // Note: We use a *plain text* unique identifier (like 'admin-user') 
  // for the `where` clause, NOT the hashed PIN.
  const adminUser = await prisma.staff.upsert({
    where: { name: 'Admin' }, // Use a stable, unique field
    update: {
      pinCode: hashedPin, // Update the PIN in case it changed
    },
    create: {
      name: 'Admin',
      defaultRole: StaffRole.Cashier, // Admin/Cashier has all rights for now
      pinCode: hashedPin,
      isActive: true,
    },
  });

  console.log(`Created/updated admin user: ${adminUser.name}`);
  console.log(`Login PIN: ${defaultPin}`);

  // --- Seed Environments based on photos ---
  const lounge = await prisma.environment.upsert({
    where: { name: 'Main Lounge' },
    update: {},
    create: {
      name: 'Main Lounge',
      type: 'Public',
      capacity: 20,
    },
  });

  const poolside = await prisma.environment.upsert({
    where: { name: 'Poolside' },
    update: {},
    create: {
      name: 'Poolside',
      type: 'Public',
      capacity: 15,
    },
  });

  const patio = await prisma.environment.upsert({
    where: { name: 'Patio' },
    update: {},
    create: {
      name: 'Patio',
      type: 'Public',
      capacity: 10,
    },
  });
  
  const vip1 = await prisma.environment.upsert({
    where: { name: 'VIP Lounge 1' },
    update: {},
    create: {
      name: 'VIP Lounge 1',
      type: 'VIP',
      capacity: 8,
    },
  });

  console.log(`Created/updated environments: ${lounge.name}, ${poolside.name}, ${patio.name}, ${vip1.name}`);
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

