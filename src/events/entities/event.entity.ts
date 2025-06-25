import { Prisma } from '@prisma/client';
import { Room } from '../../rooms/entities/room.entity';

export class Event implements Prisma.EventUncheckedCreateInput {
  id: number;
  name: string;
  roomId: number;
  startTime: Date;
  endTime: Date;
  room?: Room;
}