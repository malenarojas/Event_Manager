import { Prisma } from '@prisma/client';

export class Room implements Prisma.RoomUncheckedCreateInput {
  id: number;
  name: string;
}

