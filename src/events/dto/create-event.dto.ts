import { IsDateString, IsInt, IsNotEmpty, IsString, Min, Validate } from 'class-validator';
import { IsEndTimeAfterStartTime } from '../validators/end-time-after-start-time.validator';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty({ message: 'Event name is required' })
  name: string;

  @IsInt({ message: 'Room ID must be an integer' })
  @Min(1, { message: 'Room ID must be greater than 0' })
  roomId: number;

  @IsDateString({}, { message: 'Start time must be a valid date string' })
  startTime: string;

  @IsDateString({}, { message: 'End time must be a valid date string' })
  @Validate(IsEndTimeAfterStartTime, ['startTime'], {
    message: 'End time must be after start time',
  })
  endTime: string;
}

