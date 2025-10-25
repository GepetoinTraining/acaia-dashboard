// In prisma/seed.ts
import { PrismaClient, StaffRole, SeatingAreaType } from '@prisma/client';
import { hash } from 'bcryptjs';
import { randomBytes } from 'crypto'; // For generating tokens

const prisma = new PrismaClient();

// Helper to generate a unique token
function generateUniqueToken(length = 10) {
  return randomBytes(length).toString('hex');
}

async function main() {
  console.log('Start seeding Acaia data...');

  // --- Staff ---
  const defaultPin = '123456'; // Updated to 6 digits
  const hashedPin = await hash(defaultPin, 12);

  const managerUser = await prisma.staff.upsert({
    where: { name: 'Manager' }, // Use name as unique identifier for upsert
    update: { pinCode: hashedPin, defaultRole: StaffRole.Manager }, // Ensure role is Manager
    create: {
      name: 'Manager',
      defaultRole: StaffRole.Manager, // Assign Manager role
      pinCode: hashedPin,
      isActive: true,
    },
  });
  console.log(`Created/updated manager user: ${managerUser.name} (PIN: ${defaultPin})`);

  // --- Seating Areas ---
  const seatingAreasData = [
    { name: 'Table 1 (T1)', capacity: 4, type: SeatingAreaType.TABLE, reservationCost: 10.00, qrCodeToken: generateUniqueToken(), isActive: true },
    { name: 'Table 2 (T2)', capacity: 4, type: SeatingAreaType.TABLE, reservationCost: 10.00, qrCodeToken: generateUniqueToken(), isActive: true },
    { name: 'Bar Seat 1 (B1)', capacity: 1, type: SeatingAreaType.BAR_SEAT, reservationCost: 0, qrCodeToken: generateUniqueToken(), isActive: true },
    { name: 'Lounge Couch A', capacity: 6, type: SeatingAreaType.LOUNGE_SEAT, reservationCost: 25.00, qrCodeToken: generateUniqueToken(), isActive: true },
    { name: 'DJ Booth', capacity: 2, type: SeatingAreaType.DJ_BOOTH, reservationCost: 0, qrCodeToken: generateUniqueToken(), isActive: false }, // DJ Booth itself might not be assignable to visits initially
  ];

  console.log('Creating/updating Seating Areas...');
  for (const area of seatingAreasData) {
    const createdArea = await prisma.seatingArea.upsert({
      where: { name: area.name },
      update: { capacity: area.capacity, type: area.type, reservationCost: area.reservationCost, isActive: area.isActive ?? true, qrCodeToken: area.qrCodeToken }, // Ensure token is updated/set
      create: area,
    });
    console.log(`- ${createdArea.name} (Token: ${createdArea.qrCodeToken})`);
  }

  // --- Vinyl Record ---
  const vinylRecord = await prisma.vinylRecord.upsert({
      where: { artist_title: { artist: "Example Artist", title: "Example Album" } }, // Use composite unique key
      update: {},
      create: {
          artist: "Example Artist",
          title: "Example Album",
          genre: "Example Genre",
          year: 2024,
      },
  });
  console.log(`Created/updated vinyl record: ${vinylRecord.artist} - ${vinylRecord.title}`);

  // --- Entertainer ---
  const entertainer = await prisma.entertainer.upsert({
      where: { name: "DJ Example" }, // Assuming name is unique enough for seeding
      update: {},
      create: {
          name: "DJ Example",
          type: "DJ",
          contactNotes: "Plays on Fridays.",
          isActive: true, // Ensure seeded entertainer is active
      },
  });
  console.log(`Created/updated entertainer: ${entertainer.name}`);


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