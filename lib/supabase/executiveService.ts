import { supabase } from './config';
import { errorMessage } from './errors';
import { CreateExecutiveDto, Executive, UpdateExecutiveDto } from '@/types/executive';

const TABLE = 'executives';

interface ExecutiveRow {
  id: string;
  name: string;
  role: string;
  image_url: string;
  bio: string | null;
  sort_order: number;
}

function mapRow(row: ExecutiveRow): Executive {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    imageUrl: row.image_url,
    bio: row.bio || '',
    sortOrder: row.sort_order,
  };
}

export const getExecutives = async (): Promise<Executive[]> => {
  const { data, error } = await supabase.from(TABLE).select('*').order('sort_order', { ascending: true });
  if (error) {
    console.error('Error getting executives:', errorMessage(error));
    throw error;
  }
  return (data as ExecutiveRow[]).map(mapRow);
};

export const createExecutive = async (data: CreateExecutiveDto): Promise<string> => {
  const { data: row, error } = await supabase
    .from(TABLE)
    .insert({
      name: data.name,
      role: data.role,
      image_url: data.imageUrl,
      bio: data.bio,
      sort_order: data.sortOrder ?? 0,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating executive:', errorMessage(error));
    throw error;
  }
  return row.id;
};

export const updateExecutive = async (id: string, data: UpdateExecutiveDto): Promise<void> => {
  const payload: Record<string, unknown> = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.role !== undefined) payload.role = data.role;
  if (data.imageUrl !== undefined) payload.image_url = data.imageUrl;
  if (data.bio !== undefined) payload.bio = data.bio;
  if (data.sortOrder !== undefined) payload.sort_order = data.sortOrder;

  const { error } = await supabase.from(TABLE).update(payload).eq('id', id);
  if (error) {
    console.error('Error updating executive:', errorMessage(error));
    throw error;
  }
};

export const deleteExecutive = async (id: string): Promise<void> => {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) {
    console.error('Error deleting executive:', errorMessage(error));
    throw error;
  }
};
