import { supabase } from './config';
import { errorMessage } from './errors';
import { CreateMaterialFolderDto, MaterialFolder } from '@/types/materialFolder';
import { MaterialLevel } from '@/types/material';

const TABLE = 'material_folders';

interface FolderRow {
  id: string;
  name: string;
  level: MaterialLevel;
  type: 'material' | 'past_question';
  created_by: string | null;
  created_at: string;
}

function mapRow(row: FolderRow): MaterialFolder {
  return {
    id: row.id,
    name: row.name,
    level: row.level,
    type: row.type,
    createdAt: new Date(row.created_at),
    createdBy: row.created_by || '',
  };
}

export const createFolder = async (data: CreateMaterialFolderDto, userId: string): Promise<string> => {
  const { data: row, error } = await supabase
    .from(TABLE)
    .insert({
      name: data.name,
      level: data.level,
      type: data.type,
      created_by: userId,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating folder:', errorMessage(error));
    throw error;
  }
  return row.id;
};

export const getFoldersByLevel = async (level: MaterialLevel): Promise<MaterialFolder[]> => {
  const { data, error } = await supabase.from(TABLE).select('*').eq('level', level);
  if (error) {
    console.error('Error getting folders:', errorMessage(error));
    throw error;
  }
  return (data as FolderRow[]).map(mapRow);
};

export const deleteFolder = async (id: string): Promise<void> => {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) {
    console.error('Error deleting folder:', errorMessage(error));
    throw error;
  }
};
