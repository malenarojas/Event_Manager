import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateEventDto } from './dto/update-event.dto';

export async function validateEventCreation(
  prisma: PrismaService,
  name: string,
  start: Date,
  end: Date,
  roomId: number,
) {
  if (start >= end) {
    throw new BadRequestException('Start time must be before end time.');
  }

  const existingEvent = await prisma.event.findUnique({
    where: { name },
  });
  if (existingEvent) {
    throw new BadRequestException('An event with this name already exists.');
  }

  const room = await prisma.room.findUnique({
    where: { id: roomId },
  });
  if (!room) {
    throw new NotFoundException('Room not found.');
  }
}

export async function validateEventUpdate(
  prisma: PrismaService,
  eventId: number,
  dto: UpdateEventDto,
) {
  // Check if event exists
  const existingEvent = await prisma.event.findUnique({
    where: { id: eventId },
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
    const nameConflict = await prisma.event.findUnique({
      where: { name: dto.name },
    });

    if (nameConflict) {
      throw new BadRequestException('An event with this name already exists.');
    }
  }

  return existingEvent;
} 