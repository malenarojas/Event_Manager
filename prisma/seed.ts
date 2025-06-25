import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create rooms
  const rooms = await Promise.all([
    prisma.room.upsert({
      where: { name: 'Main Hall' },
      update: {},
      create: { name: 'Main Hall' },
    }),
    prisma.room.upsert({
      where: { name: 'Conference Room A' },
      update: {},
      create: { name: 'Conference Room A' },
    }),
    prisma.room.upsert({
      where: { name: 'Conference Room B' },
      update: {},
      create: { name: 'Conference Room B' },
    }),
    prisma.room.upsert({
      where: { name: 'Workshop Room' },
      update: {},
      create: { name: 'Workshop Room' },
    }),
    prisma.room.upsert({
      where: { name: 'Auditorium' },
      update: {},
      create: { name: 'Auditorium' },
    }),
  ]);

  console.log(`✅ Created ${rooms.length} rooms`);

  // Create sample events
  const events = await Promise.all([
    // Main Hall events
    prisma.event.upsert({
      where: { name: 'Tech Conference 2024' },
      update: {},
      create: {
        name: 'Tech Conference 2024',
        roomId: rooms[0].id, // Main Hall
        startTime: new Date('2024-01-15T09:00:00Z'),
        endTime: new Date('2024-01-15T17:00:00Z'),
      },
    }),
    prisma.event.upsert({
      where: { name: 'Annual Meeting' },
      update: {},
      create: {
        name: 'Annual Meeting',
        roomId: rooms[0].id, // Main Hall
        startTime: new Date('2024-01-16T10:00:00Z'),
        endTime: new Date('2024-01-16T14:00:00Z'),
      },
    }),

    // Conference Room A events
    prisma.event.upsert({
      where: { name: 'Product Launch' },
      update: {},
      create: {
        name: 'Product Launch',
        roomId: rooms[1].id, // Conference Room A
        startTime: new Date('2024-01-15T10:00:00Z'),
        endTime: new Date('2024-01-15T12:00:00Z'),
      },
    }),
    prisma.event.upsert({
      where: { name: 'Team Building Workshop' },
      update: {},
      create: {
        name: 'Team Building Workshop',
        roomId: rooms[1].id, // Conference Room A
        startTime: new Date('2024-01-15T14:00:00Z'),
        endTime: new Date('2024-01-15T16:00:00Z'),
      },
    }),

    // Conference Room B events
    prisma.event.upsert({
      where: { name: 'Client Presentation' },
      update: {},
      create: {
        name: 'Client Presentation',
        roomId: rooms[2].id, // Conference Room B
        startTime: new Date('2024-01-15T11:00:00Z'),
        endTime: new Date('2024-01-15T13:00:00Z'),
      },
    }),
    prisma.event.upsert({
      where: { name: 'Strategy Meeting' },
      update: {},
      create: {
        name: 'Strategy Meeting',
        roomId: rooms[2].id, // Conference Room B
        startTime: new Date('2024-01-16T09:00:00Z'),
        endTime: new Date('2024-01-16T11:00:00Z'),
      },
    }),

    // Workshop Room events
    prisma.event.upsert({
      where: { name: 'Coding Bootcamp' },
      update: {},
      create: {
        name: 'Coding Bootcamp',
        roomId: rooms[3].id, // Workshop Room
        startTime: new Date('2024-01-15T09:00:00Z'),
        endTime: new Date('2024-01-15T18:00:00Z'),
      },
    }),

    // Auditorium events
    prisma.event.upsert({
      where: { name: 'Keynote Speech' },
      update: {},
      create: {
        name: 'Keynote Speech',
        roomId: rooms[4].id, // Auditorium
        startTime: new Date('2024-01-15T13:00:00Z'),
        endTime: new Date('2024-01-15T15:00:00Z'),
      },
    }),
    prisma.event.upsert({
      where: { name: 'Award Ceremony' },
      update: {},
      create: {
        name: 'Award Ceremony',
        roomId: rooms[4].id, // Auditorium
        startTime: new Date('2024-01-16T16:00:00Z'),
        endTime: new Date('2024-01-16T18:00:00Z'),
      },
    }),

    // Future events for testing upcoming events endpoint
    prisma.event.upsert({
      where: { name: 'Future Conference' },
      update: {},
      create: {
        name: 'Future Conference',
        roomId: rooms[0].id, // Main Hall
        startTime: new Date('2024-02-01T09:00:00Z'),
        endTime: new Date('2024-02-01T17:00:00Z'),
      },
    }),
    prisma.event.upsert({
      where: { name: 'Next Month Workshop' },
      update: {},
      create: {
        name: 'Next Month Workshop',
        roomId: rooms[3].id, // Workshop Room
        startTime: new Date('2024-02-15T10:00:00Z'),
        endTime: new Date('2024-02-15T16:00:00Z'),
      },
    }),
  ]);

  console.log(`✅ Created ${events.length} events`);

  // Create some overlapping events to test conflict scenarios
  const overlappingEvents = await Promise.all([
    prisma.event.upsert({
      where: { name: 'Morning Session' },
      update: {},
      create: {
        name: 'Morning Session',
        roomId: rooms[1].id, // Conference Room A
        startTime: new Date('2024-01-20T09:00:00Z'),
        endTime: new Date('2024-01-20T11:00:00Z'),
      },
    }),
    prisma.event.upsert({
      where: { name: 'Afternoon Session' },
      update: {},
      create: {
        name: 'Afternoon Session',
        roomId: rooms[1].id, // Conference Room A
        startTime: new Date('2024-01-20T14:00:00Z'),
        endTime: new Date('2024-01-20T16:00:00Z'),
      },
    }),
  ]);

  console.log(`✅ Created ${overlappingEvents.length} additional events for testing`);

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📊 Sample Data Summary:');
  console.log(`   • Rooms: ${rooms.length}`);
  console.log(`   • Events: ${events.length + overlappingEvents.length}`);
  console.log('\n🔍 Test Scenarios Available:');
  console.log('   • Event creation with overlap detection');
  console.log('   • Active events in time range');
  console.log('   • Room-specific events');
  console.log('   • Currently active events');
  console.log('   • Upcoming events');
  console.log('   • Room availability checking');
  console.log('   • Event cancellation by name');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });