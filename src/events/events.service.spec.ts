import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { EventsService } from './events.service';

describe('EventsService', () => {
  let service: EventsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    event: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    room: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createEventDto: CreateEventDto = {
      name: 'Test Event',
      roomId: 1,
      startTime: '2024-01-01T10:00:00Z',
      endTime: '2024-01-01T12:00:00Z',
    };

    const mockRoom = {
      id: 1,
      name: 'Test Room',
    };

    const mockEvent = {
      id: 1,
      name: 'Test Event',
      roomId: 1,
      startTime: new Date('2024-01-01T10:00:00Z'),
      endTime: new Date('2024-01-01T12:00:00Z'),
      room: mockRoom,
    };

    it('should create an event successfully', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(null);
      mockPrismaService.room.findUnique.mockResolvedValue(mockRoom);
      mockPrismaService.event.findFirst.mockResolvedValue(null);
      mockPrismaService.event.create.mockResolvedValue(mockEvent);

      const result = await service.create(createEventDto);

      expect(result).toEqual({
        ...mockEvent,
        message: 'Event created successfully',
      });
      expect(mockPrismaService.event.create).toHaveBeenCalledWith({
        data: {
          name: createEventDto.name,
          roomId: createEventDto.roomId,
          startTime: new Date(createEventDto.startTime),
          endTime: new Date(createEventDto.endTime),
        },
        include: {
          room: true,
        },
      });
    });

    it('should throw BadRequestException when start time is after end time', async () => {
      const invalidDto = {
        ...createEventDto,
        startTime: '2024-01-01T12:00:00Z',
        endTime: '2024-01-01T10:00:00Z',
      };

      await expect(service.create(invalidDto)).rejects.toThrow(
        new BadRequestException('Start time must be before end time.'),
      );
    });

    it('should throw BadRequestException when event name already exists', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);

      await expect(service.create(createEventDto)).rejects.toThrow(
        new BadRequestException('An event with this name already exists.'),
      );
    });

    it('should throw NotFoundException when room does not exist', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(null);
      mockPrismaService.room.findUnique.mockResolvedValue(null);

      await expect(service.create(createEventDto)).rejects.toThrow(
        new NotFoundException('Room not found.'),
      );
    });

    it('should throw BadRequestException when event overlaps with existing event', async () => {
      const overlappingEvent = {
        id: 2,
        name: 'Overlapping Event',
        roomId: 1,
        startTime: new Date('2024-01-01T11:00:00Z'),
        endTime: new Date('2024-01-01T13:00:00Z'),
        room: mockRoom,
      };

      mockPrismaService.event.findUnique.mockResolvedValue(null);
      mockPrismaService.room.findUnique.mockResolvedValue(mockRoom);
      mockPrismaService.event.findFirst.mockResolvedValue(overlappingEvent);

      await expect(service.create(createEventDto)).rejects.toThrow(
        new BadRequestException(
          `Event overlaps with existing event "${overlappingEvent.name}" in room "${mockRoom.name}". ` +
          `Conflicting time: ${overlappingEvent.startTime.toISOString()} - ${overlappingEvent.endTime.toISOString()}`
        ),
      );
    });
  });

  describe('findActiveBetween', () => {
    it('should return events active in the given time range', async () => {
      const start = '2024-01-01T10:00:00Z';
      const end = '2024-01-01T14:00:00Z';
      const mockEvents = [
        {
          id: 1,
          name: 'Event 1',
          startTime: new Date('2024-01-01T11:00:00Z'),
          endTime: new Date('2024-01-01T12:00:00Z'),
          room: { id: 1, name: 'Room 1' },
        },
      ];

      mockPrismaService.event.findMany.mockResolvedValue(mockEvents);

      const result = await service.findActiveBetween(start, end);

      expect(result).toEqual(mockEvents);
      expect(mockPrismaService.event.findMany).toHaveBeenCalledWith({
        where: {
          AND: [
            { startTime: { lt: new Date(end) } },
            { endTime: { gt: new Date(start) } },
          ],
        },
        include: {
          room: true,
        },
        orderBy: [
          { startTime: 'asc' },
          { roomId: 'asc' },
        ],
      });
    });

    it('should throw BadRequestException for invalid date format', async () => {
      await expect(service.findActiveBetween('invalid-date', '2024-01-01T14:00:00Z')).rejects.toThrow(
        new BadRequestException('Invalid date format provided.'),
      );
    });

    it('should throw BadRequestException when start date is after end date', async () => {
      await expect(service.findActiveBetween('2024-01-01T14:00:00Z', '2024-01-01T10:00:00Z')).rejects.toThrow(
        new BadRequestException('Start date must be before end date.'),
      );
    });
  });

  describe('findCurrentlyActive', () => {
    it('should return currently active events', async () => {
      const mockEvents = [
        {
          id: 1,
          name: 'Active Event',
          startTime: new Date('2024-01-01T10:00:00Z'),
          endTime: new Date('2024-01-01T12:00:00Z'),
          room: { id: 1, name: 'Room 1' },
        },
      ];

      mockPrismaService.event.findMany.mockResolvedValue(mockEvents);

      const result = await service.findCurrentlyActive();

      expect(result).toEqual(mockEvents);
      expect(mockPrismaService.event.findMany).toHaveBeenCalledWith({
        where: {
          AND: [
            { startTime: { lte: expect.any(Date) } },
            { endTime: { gt: expect.any(Date) } },
          ],
        },
        include: {
          room: true,
        },
        orderBy: [
          { startTime: 'asc' },
          { roomId: 'asc' },
        ],
      });
    });
  });

  describe('cancelByName', () => {
    it('should cancel event by name successfully', async () => {
      const mockEvent = {
        id: 1,
        name: 'Test Event',
        roomId: 1,
        startTime: new Date('2024-01-01T10:00:00Z'),
        endTime: new Date('2024-01-01T12:00:00Z'),
      };

      mockPrismaService.event.findFirst.mockResolvedValue(mockEvent);
      mockPrismaService.event.delete.mockResolvedValue(mockEvent);

      const result = await service.cancelByName('Test Event');

      expect(result).toEqual(mockEvent);
      expect(mockPrismaService.event.findFirst).toHaveBeenCalledWith({
        where: { name: 'Test Event' },
      });
      expect(mockPrismaService.event.delete).toHaveBeenCalledWith({
        where: { name: 'Test Event' },
      });
    });

    it('should throw NotFoundException when event name does not exist', async () => {
      mockPrismaService.event.findFirst.mockResolvedValue(null);

      await expect(service.cancelByName('Non-existent Event')).rejects.toThrow(
        new NotFoundException('Event not found.'),
      );
    });
  });
});
