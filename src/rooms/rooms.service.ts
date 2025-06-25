import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateRoomDto } from './dto/update-room.dto';


@Injectable()
export class RoomsService{
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.room.findMany({ include: { events: true } });
  }

  create(data: Prisma.RoomCreateInput) {
    return this.prisma.room.create({ data });
  }

  findOne(id: number) {
    return `This action returns a #${id} room`;
  }

  update(id: number, updateRoomDto: UpdateRoomDto) {
    return `This action updates a #${id} room`;
  }

  remove(id: number) {
    return `This action removes a #${id} room`;
  }
}
