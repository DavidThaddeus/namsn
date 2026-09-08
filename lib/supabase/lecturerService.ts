import { supabase } from './config';
import { errorMessage } from './errors';
import { CreateLecturerDto, Lecturer, UpdateLecturerDto } from '@/types/lecturer';

const TABLE = 'lecturers';

interface LecturerRow {
  id: string;
  name: string;
  title: string;
  specialization: string | null;
  image_url: string;
  sort_order: number;
}

function mapRow(row: LecturerRow): Lecturer {
  return {
    id: row.id,
    name: row.name,
    title: row.title,
    specialization: row.specialization || '',
    imageUrl: row.image_url,
    sortOrder: row.sort_order,
  };
}

export const getLecturers = async (): Promise<Lecturer[]> => {
  const { data, error } = await supabase.from(TABLE).select('*').order('sort_order', { ascending: true });
  if (error) {
    console.error('Error getting lecturers:', errorMessage(error));
    throw error;
  }
  return (data as LecturerRow[]).map(mapRow);
};

export const createLecturer = async (data: CreateLecturerDto): Promise<string> => {
  const { data: row, error } = await supabase
    .from(TABLE)
    .insert({
      name: data.name,
      title: data.title,
      specialization: data.specialization,
      image_url: data.imageUrl,
      sort_order: data.sortOrder ?? 0,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating lecturer:', errorMessage(error));
    throw error;
  }
  return row.id;
};

export const updateLecturer = async (id: string, data: UpdateLecturerDto): Promise<void> => {
  const payload: Record<string, unknown> = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.title !== undefined) payload.title = data.title;
  if (data.specialization !== undefined) payload.specialization = data.specialization;
  if (data.imageUrl !== undefined) payload.image_url = data.imageUrl;
  if (data.sortOrder !== undefined) payload.sort_order = data.sortOrder;

  const { error } = await supabase.from(TABLE).update(payload).eq('id', id);
  if (error) {
    console.error('Error updating lecturer:', errorMessage(error));
    throw error;
  }
};

export const deleteLecturer = async (id: string): Promise<void> => {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) {
    console.error('Error deleting lecturer:', errorMessage(error));
    throw error;
  }
};
