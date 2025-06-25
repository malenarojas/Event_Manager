import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  create(@Body() createEventDto: CreateEventDto) {
    return this.eventsService.create(createEventDto);
  }

  @Get()
  findAll(@Query('start') start?: string, @Query('end') end?: string) {
    if (start && end) {
      return this.eventsService.findActiveBetween(start, end);
    }
    return this.eventsService.findAll();
  }

  @Get('active')
  findCurrentlyActive() {
    return this.eventsService.findCurrentlyActive();
  }

  @Get('upcoming')
  findUpcoming(@Query('limit') limit?: string) {
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    return this.eventsService.findUpcoming(limitNumber);
  }

  @Get('room/:roomId')
  findByRoom(@Param('roomId') roomId: string) {
    return this.eventsService.findByRoom(+roomId);
  }

  @Get('availability/:roomId')
  getRoomAvailability(
    @Param('roomId') roomId: string,
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    return this.eventsService.getRoomAvailability(+roomId, start, end);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEventDto: UpdateEventDto) {
    return this.eventsService.update(+id, updateEventDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.eventsService.remove(+id);
  }

  @Delete()
  cancelByName(@Query('name') name: string) {
    return this.eventsService.cancelByName(name);
  }
}