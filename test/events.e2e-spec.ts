import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('EventsController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    // Clean database before each test
    await prismaService.event.deleteMany();
    await prismaService.room.deleteMany();
    
    // Create test rooms
    await prismaService.room.createMany({
      data: [
        { name: 'Room 1' },
        { name: 'Room 2' },
        { name: 'Room 3' },
      ],
    });
  });

  afterAll(async () => {
    await prismaService.event.deleteMany();
    await prismaService.room.deleteMany();
    await app.close();
  });

  describe('/events (POST)', () => {
    it('should create a new event successfully', async () => {
      const createEventDto = {
        name: 'Event A',
        roomId: 1,
        startTime: '2024-01-15T09:00:00Z',
        endTime: '2024-01-15T11:00:00Z',
      };

      const response = await request(app.getHttpServer())
        .post('/events')
        .send(createEventDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Event A');
      expect(response.body.roomId).toBe(1);
      expect(response.body.message).toBe('Event created successfully');
      expect(response.body.room).toBeDefined();
    });

    it('should reject overlapping events in the same room', async () => {
      // Create first event
      await request(app.getHttpServer())
        .post('/events')
        .send({
          name: 'Event A',
          roomId: 1,
          startTime: '2024-01-15T09:00:00Z',
          endTime: '2024-01-15T11:00:00Z',
        })
        .expect(201);

      // Try to create overlapping event
      const response = await request(app.getHttpServer())
        .post('/events')
        .send({
          name: 'Event B',
          roomId: 1,
          startTime: '2024-01-15T10:30:00Z',
          endTime: '2024-01-15T12:00:00Z',
        })
        .expect(400);

      expect(response.body.message).toContain('Event overlaps with existing event');
    });

    it('should allow concurrent events in different rooms', async () => {
      // Create event in Room 1
      await request(app.getHttpServer())
        .post('/events')
        .send({
          name: 'Event A',
          roomId: 1,
          startTime: '2024-01-15T09:00:00Z',
          endTime: '2024-01-15T11:00:00Z',
        })
        .expect(201);

      // Create concurrent event in Room 2
      const response = await request(app.getHttpServer())
        .post('/events')
        .send({
          name: 'Event C',
          roomId: 2,
          startTime: '2024-01-15T10:00:00Z',
          endTime: '2024-01-15T11:30:00Z',
        })
        .expect(201);

      expect(response.body.name).toBe('Event C');
      expect(response.body.roomId).toBe(2);
    });

    it('should reject events with start time after end time', async () => {
      const response = await request(app.getHttpServer())
        .post('/events')
        .send({
          name: 'Invalid Event',
          roomId: 1,
          startTime: '2024-01-15T12:00:00Z',
          endTime: '2024-01-15T10:00:00Z',
        })
        .expect(400);

      expect(response.body.message).toBe('Start time must be before end time.');
    });

    it('should reject duplicate event names', async () => {
      // Create first event
      await request(app.getHttpServer())
        .post('/events')
        .send({
          name: 'Unique Event',
          roomId: 1,
          startTime: '2024-01-15T09:00:00Z',
          endTime: '2024-01-15T11:00:00Z',
        })
        .expect(201);

      // Try to create event with same name
      const response = await request(app.getHttpServer())
        .post('/events')
        .send({
          name: 'Unique Event',
          roomId: 2,
          startTime: '2024-01-15T12:00:00Z',
          endTime: '2024-01-15T14:00:00Z',
        })
        .expect(400);

      expect(response.body.message).toBe('An event with this name already exists.');
    });
  });

  describe('/events (GET) - Active events in time range', () => {
    beforeEach(async () => {
      // Create test events
      await request(app.getHttpServer())
        .post('/events')
        .send({
          name: 'Event A',
          roomId: 1,
          startTime: '2024-01-15T09:00:00Z',
          endTime: '2024-01-15T11:00:00Z',
        });

      await request(app.getHttpServer())
        .post('/events')
        .send({
          name: 'Event C',
          roomId: 2,
          startTime: '2024-01-15T10:00:00Z',
          endTime: '2024-01-15T11:30:00Z',
        });
    });

    it('should return events active between 10:00 and 10:45', async () => {
      const response = await request(app.getHttpServer())
        .get('/events?start=2024-01-15T10:00:00Z&end=2024-01-15T10:45:00Z')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].name).toBe('Event A');
      expect(response.body[1].name).toBe('Event C');
    });

    it('should return empty array for time range with no events', async () => {
      const response = await request(app.getHttpServer())
        .get('/events?start=2024-01-15T12:00:00Z&end=2024-01-15T13:00:00Z')
        .expect(200);

      expect(response.body).toHaveLength(0);
    });

    it('should handle edge case: events starting exactly at range start', async () => {
      const response = await request(app.getHttpServer())
        .get('/events?start=2024-01-15T10:00:00Z&end=2024-01-15T10:30:00Z')
        .expect(200);

      expect(response.body).toHaveLength(2);
    });

    it('should handle edge case: events ending exactly at range end', async () => {
      const response = await request(app.getHttpServer())
        .get('/events?start=2024-01-15T09:30:00Z&end=2024-01-15T11:00:00Z')
        .expect(200);

      expect(response.body).toHaveLength(2);
    });
  });

  describe('/events (DELETE) - Cancel event by name', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/events')
        .send({
          name: 'Event A',
          roomId: 1,
          startTime: '2024-01-15T09:00:00Z',
          endTime: '2024-01-15T11:00:00Z',
        });
    });

    it('should cancel event by name successfully', async () => {
      const response = await request(app.getHttpServer())
        .delete('/events?name=Event%20A')
        .expect(200);

      expect(response.body.name).toBe('Event A');
      
      // Verify event is deleted
      const getResponse = await request(app.getHttpServer())
        .get('/events')
        .expect(200);
      
      expect(getResponse.body).toHaveLength(0);
    });

    it('should return 404 for non-existent event name', async () => {
      await request(app.getHttpServer())
        .delete('/events?name=NonExistentEvent')
        .expect(404);
    });
  });

  describe('/events/active (GET)', () => {
    it('should return currently active events', async () => {
      // Create an event that should be active now
      const now = new Date();
      const startTime = new Date(now.getTime() - 1000 * 60 * 60); // 1 hour ago
      const endTime = new Date(now.getTime() + 1000 * 60 * 60);   // 1 hour from now

      await request(app.getHttpServer())
        .post('/events')
        .send({
          name: 'Currently Active Event',
          roomId: 1,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        });

      const response = await request(app.getHttpServer())
        .get('/events/active')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe('Currently Active Event');
    });
  });

  describe('/events/upcoming (GET)', () => {
    it('should return upcoming events', async () => {
      const future = new Date();
      future.setHours(future.getHours() + 2);

      await request(app.getHttpServer())
        .post('/events')
        .send({
          name: 'Future Event',
          roomId: 1,
          startTime: future.toISOString(),
          endTime: new Date(future.getTime() + 1000 * 60 * 60).toISOString(),
        });

      const response = await request(app.getHttpServer())
        .get('/events/upcoming')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe('Future Event');
    });
  });

  describe('/events/room/:roomId (GET)', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/events')
        .send({
          name: 'Room 1 Event',
          roomId: 1,
          startTime: '2024-01-15T09:00:00Z',
          endTime: '2024-01-15T11:00:00Z',
        });

      await request(app.getHttpServer())
        .post('/events')
        .send({
          name: 'Room 2 Event',
          roomId: 2,
          startTime: '2024-01-15T10:00:00Z',
          endTime: '2024-01-15T11:30:00Z',
        });
    });

    it('should return events for specific room', async () => {
      const response = await request(app.getHttpServer())
        .get('/events/room/1')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe('Room 1 Event');
      expect(response.body[0].roomId).toBe(1);
    });
  });

  describe('/events/availability/:roomId (GET)', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/events')
        .send({
          name: 'Existing Event',
          roomId: 1,
          startTime: '2024-01-15T10:00:00Z',
          endTime: '2024-01-15T12:00:00Z',
        });
    });

    it('should check room availability correctly', async () => {
      const response = await request(app.getHttpServer())
        .get('/events/availability/1?start=2024-01-15T09:00:00Z&end=2024-01-15T11:00:00Z')
        .expect(200);

      expect(response.body.isAvailable).toBe(false);
      expect(response.body.conflictingEvents).toHaveLength(1);
      expect(response.body.conflictingEvents[0].name).toBe('Existing Event');
    });

    it('should show room as available for non-conflicting time', async () => {
      const response = await request(app.getHttpServer())
        .get('/events/availability/1?start=2024-01-15T13:00:00Z&end=2024-01-15T15:00:00Z')
        .expect(200);

      expect(response.body.isAvailable).toBe(true);
      expect(response.body.conflictingEvents).toHaveLength(0);
    });
  });

  describe('Edge Cases / Casos Extremos', () => {
    it('should handle events with exact same start and end times', async () => {
      const response = await request(app.getHttpServer())
        .post('/events')
        .send({
          name: 'Instant Event',
          roomId: 1,
          startTime: '2024-01-15T10:00:00Z',
          endTime: '2024-01-15T10:00:00Z',
        })
        .expect(400);

      expect(response.body.message).toBe('Start time must be before end time.');
    });

    it('should handle invalid date formats gracefully', async () => {
      const response = await request(app.getHttpServer())
        .get('/events?start=invalid-date&end=2024-01-15T10:00:00Z')
        .expect(400);

      expect(response.body.message).toBe('Invalid date format provided.');
    });

    it('should handle non-existent room IDs', async () => {
      const response = await request(app.getHttpServer())
        .post('/events')
        .send({
          name: 'Event in Non-existent Room',
          roomId: 999,
          startTime: '2024-01-15T09:00:00Z',
          endTime: '2024-01-15T11:00:00Z',
        })
        .expect(404);

      expect(response.body.message).toBe('Room not found.');
    });
  });
}); 