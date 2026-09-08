import { supabase } from './config';
import { errorMessage } from './errors';
import { Timetable, TimetableLevel, TimetableRow } from '@/types/timetable';

const TABLE = 'timetables';

interface TimetableRow_DB {
  level: TimetableLevel;
  mode: 'rows' | 'image';
  rows: TimetableRow[];
  image_url: string | null;
  updated_at: string;
}

export const getTimetable = async (level: TimetableLevel): Promise<Timetable | null> => {
  const { data, error } = await supabase.from(TABLE).select('*').eq('level', level).maybeSingle();

  if (error) {
    console.error('Error getting timetable:', errorMessage(error));
    throw error;
  }
  if (!data) return null;

  const row = data as TimetableRow_DB;
  return {
    level: row.level,
    mode: row.mode,
    rows: row.rows || [],
    imageUrl: row.image_url || undefined,
    updatedAt: new Date(row.updated_at),
  };
};

export const saveTimetableRows = async (level: TimetableLevel, rows: TimetableRow[]): Promise<void> => {
  const { error } = await supabase.from(TABLE).upsert({
    level,
    mode: 'rows',
    rows,
    image_url: null,
  });
  if (error) {
    console.error('Error saving timetable:', errorMessage(error));
    throw error;
  }
};

export const saveTimetableImage = async (level: TimetableLevel, imageUrl: string): Promise<void> => {
  const { error } = await supabase.from(TABLE).upsert({
    level,
    mode: 'image',
    rows: [],
    image_url: imageUrl,
  });
  if (error) {
    console.error('Error saving timetable image:', errorMessage(error));
    throw error;
  }
};
