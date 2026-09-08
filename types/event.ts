import { TimestampLike } from './announcement';

export interface DepartmentEvent {
  id: string;
  title: string;
  description: string;
  tag: string; // e.g. Conference, Orientation, Workshop, Symposium
  date: TimestampLike;
  time: string; // e.g. "9:00 AM - 5:00 PM"
  venue: string;
  isImportant: boolean;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
  createdBy: string;
  createdByName: string;
}

export interface CreateEventDto {
  title: string;
  description: string;
  tag: string;
  date: Date;
  time: string;
  venue: string;
  isImportant: boolean;
}

export type UpdateEventDto = Partial<CreateEventDto>;
