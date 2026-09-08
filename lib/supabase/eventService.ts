import { supabase } from './config';
import { errorMessage } from './errors';
import { CreateEventDto, DepartmentEvent, UpdateEventDto } from '@/types/event';

const TABLE = 'events';

function toTimestampLike(value: string) {
  const date = new Date(value);
  return {
    toDate: () => date,
    toMillis: () => date.getTime(),
  };
}

// Postgres `date` columns want YYYY-MM-DD with no time component. Using the
// UTC getters here mirrors how the browser parses a bare "yyyy-MM-dd" string
// (as UTC midnight), so the date read back matches the date the form sent.
function toDateColumn(date: Date): string {
  return date.toISOString().slice(0, 10);
}

interface EventRow {
  id: string;
  title: string;
  description: string | null;
  tag: string;
  event_date: string;
  time_range: string;
  venue: string;
  is_important: boolean;
  created_by: string | null;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

function mapRow(row: EventRow): DepartmentEvent {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    tag: row.tag,
    date: toTimestampLike(row.event_date),
    time: row.time_range,
    venue: row.venue,
    isImportant: row.is_important,
    createdBy: row.created_by || '',
    createdByName: row.created_by_name,
    createdAt: toTimestampLike(row.created_at),
    updatedAt: toTimestampLike(row.updated_at),
  };
}

export const createEvent = async (data: CreateEventDto, userId: string, userName: string): Promise<string> => {
  const { data: row, error } = await supabase
    .from(TABLE)
    .insert({
      title: data.title,
      description: data.description,
      tag: data.tag,
      event_date: toDateColumn(data.date),
      time_range: data.time,
      venue: data.venue,
      is_important: data.isImportant,
      created_by: userId,
      created_by_name: userName,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating event:', errorMessage(error));
    throw error;
  }
  return row.id;
};

export const updateEvent = async (id: string, data: UpdateEventDto): Promise<void> => {
  const payload: Record<string, unknown> = {};
  if (data.title !== undefined) payload.title = data.title;
  if (data.description !== undefined) payload.description = data.description;
  if (data.tag !== undefined) payload.tag = data.tag;
  if (data.date !== undefined) payload.event_date = toDateColumn(data.date);
  if (data.time !== undefined) payload.time_range = data.time;
  if (data.venue !== undefined) payload.venue = data.venue;
  if (data.isImportant !== undefined) payload.is_important = data.isImportant;

  const { error } = await supabase.from(TABLE).update(payload).eq('id', id);
  if (error) {
    console.error('Error updating event:', errorMessage(error));
    throw error;
  }
};

export const deleteEvent = async (id: string): Promise<void> => {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) {
    console.error('Error deleting event:', errorMessage(error));
    throw error;
  }
};

export const getEvents = async (): Promise<DepartmentEvent[]> => {
  const { data, error } = await supabase.from(TABLE).select('*').order('event_date', { ascending: true });

  if (error) {
    console.error('Error getting events:', errorMessage(error));
    throw error;
  }
  return (data as EventRow[]).map(mapRow);
};
