import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEventDto) {
    const { name, roomId, startTime, endTime } = dto;

    const start = new Date(startTime);
    const end = new Date(endTime);

    // Check if start time is before end time
    if (start >= end) {
      throw new BadRequestException('Start time must be before end time.');
    }

    // Check if event name already exists
    const existingEvent = await this.prisma.event.findUnique({
      where: { name },
    });

    if (existingEvent) {
      throw new BadRequestException('An event with this name already exists.');
    }

    // Check if room exists
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundException('Room not found.');
    }

    try {
      // Check for overlapping events in the same room
      // An event overlaps if:
      // 1. New event starts before existing event ends AND
      // 2. New event ends after existing event starts
      const overlapping = await this.prisma.event.findFirst({
        where: {
          roomId,
          AND: [
            { startTime: { lt: end } }, // Existing event starts before new event ends
            { endTime: { gt: start } }, // Existing event ends after new event starts
          ],
        },
      });

      if (overlapping) {
        throw new BadRequestException(
          `Event overlaps with existing event "${overlapping.name}" in room "${room.name}". ` +
          `Conflicting time: ${overlapping.startTime.toISOString()} - ${overlapping.endTime.toISOString()}`
        );
      }

      // Create the event
      const event = await this.prisma.event.create({
        data: {
          name,
          roomId,
          startTime: start,
          endTime: end,
        },
        include: {
          room: true,
        },
      });

      return {
        ...event,
        message: 'Event created successfully',
      };
    } catch (err) {
      console.error('❌ Error creating event:', err);

      if (err instanceof BadRequestException || err instanceof NotFoundException) {
        throw err; // Re-throw handled exceptions
      }

      throw new BadRequestException('An unexpected error occurred while creating the event.');
    }
  }

  findAll() {
    return this.prisma.event.findMany({
      include: {
        room: true,
      },
    });
  }

  findOne(id: number) {
    return this.prisma.event.findUnique({
      where: { id },
      include: { room: true },
    });
  }

  async update(id: number, dto: UpdateEventDto) {
    // Check if event exists
    const existingEvent = await this.prisma.event.findUnique({
      where: { id },
      include: { room: true },
    });

    if (!existingEvent) {
      throw new NotFoundException('Event not found.');
    }

    // Validate input data if provided
    if (dto.startTime && dto.endTime) {
      const start = new Date(dto.startTime);
      const end = new Date(dto.endTime);

      if (start >= end) {
        throw new BadRequestException('Start time must be before end time.');
      }
    }

    // Check for name conflicts if name is being updated
    if (dto.name && dto.name !== existingEvent.name) {
      const nameConflict = await this.prisma.event.findUnique({
        where: { name: dto.name },
      });

      if (nameConflict) {
        throw new BadRequestException('An event with this name already exists.');
      }
    }

    // Check for overlapping events if time is being updated
    if (dto.startTime || dto.endTime) {
      const start = dto.startTime ? new Date(dto.startTime) : existingEvent.startTime;
      const end = dto.endTime ? new Date(dto.endTime) : existingEvent.endTime;

      const overlapping = await this.prisma.event.findFirst({
        where: {
          roomId: existingEvent.roomId,
          id: { not: id }, // Exclude current event
          AND: [
            { startTime: { lt: end } },
            { endTime: { gt: start } },
          ],
        },
      });

      if (overlapping) {
        throw new BadRequestException(
          `Event overlaps with existing event "${overlapping.name}" in room "${existingEvent.room.name}". ` +
          `Conflicting time: ${overlapping.startTime.toISOString()} - ${overlapping.endTime.toISOString()}`
        );
      }
    }

    // Update the event
    return await this.prisma.event.update({
      where: { id },
      data: dto,
      include: { room: true },
    });
  }

  async remove(id: number) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Event not found.');
    return this.prisma.event.delete({ where: { id } });
  }

  async cancelByName(name: string) {
    const event = await this.prisma.event.findFirst({ where: { name } });
    if (!event) throw new NotFoundException('Event not found.');
    return this.prisma.event.delete({ where: { name } });
  }

  async findActiveBetween(start: string, end: string) {
    // Validate input parameters
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid date format provided.');
    }

    if (startDate >= endDate) {
      throw new BadRequestException('Start date must be before end date.');
    }

    // Find events that are active in the given time range
    // An event is active if:
    // 1. Event starts before the end of the range AND
    // 2. Event ends after the start of the range
    return await this.prisma.event.findMany({
      where: {
        AND: [
          { startTime: { lt: endDate } }, // Event starts before range ends
          { endTime: { gt: startDate } }, // Event ends after range starts
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
  }

  // Get events by room
  async findByRoom(roomId: number) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundException('Room not found.');
    }

    return await this.prisma.event.findMany({
      where: { roomId },
      include: { room: true },
      orderBy: { startTime: 'asc' },
    });
  }

  // Get current active events (events happening now)
  async findCurrentlyActive() {
    const now = new Date();
    
    return await this.prisma.event.findMany({
      where: {
        AND: [
          { startTime: { lte: now } }, // Event has started
          { endTime: { gt: now } },    // Event hasn't ended
        ],
      },
      include: { room: true },
      orderBy: [
        { startTime: 'asc' },
        { roomId: 'asc' },
      ],
    });
  }

  // Get upcoming events
  async findUpcoming(limit: number = 10) {
    const now = new Date();
    
    return await this.prisma.event.findMany({
      where: {
        startTime: { gt: now },
      },
      include: { room: true },
      orderBy: { startTime: 'asc' },
      take: limit,
    });
  }

  // Get room availability for a specific time range
  async getRoomAvailability(roomId: number, start: string, end: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundException('Room not found.');
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid date format provided.');
    }

    if (startDate >= endDate) {
      throw new BadRequestException('Start date must be before end date.');
    }

    const conflictingEvents = await this.prisma.event.findMany({
      where: {
        roomId,
        AND: [
          { startTime: { lt: endDate } },
          { endTime: { gt: startDate } },
        ],
      },
      orderBy: { startTime: 'asc' },
    });

    return {
      room,
      requestedTimeRange: {
        start: startDate,
        end: endDate,
      },
      isAvailable: conflictingEvents.length === 0,
      conflictingEvents,
    };
  }
}
