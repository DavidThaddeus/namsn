import { supabase } from './config';
import { errorMessage } from './errors';
import { CreateMaterialDto, Material, MaterialLevel, MaterialType, UpdateMaterialDto } from '@/types/material';

const TABLE = 'materials';

function toTimestampLike(value: string) {
  const date = new Date(value);
  return {
    toDate: () => date,
    toMillis: () => date.getTime(),
  };
}

interface MaterialRow {
  id: string;
  title: string;
  course_code: string | null;
  course_name: string | null;
  file_url: string;
  file_type: string;
  file_size: string | null;
  level: MaterialLevel | null;
  type: MaterialType | null;
  folder_id: string | null;
  uploaded_by: string | null;
  uploaded_by_name: string | null;
  uploaded_at: string;
  updated_at: string;
}

function mapRow(row: MaterialRow): Material {
  return {
    id: row.id,
    title: row.title,
    courseCode: row.course_code || '',
    courseName: row.course_name || '',
    fileUrl: row.file_url,
    fileType: row.file_type,
    fileSize: row.file_size || '0 KB',
    level: row.level || undefined,
    type: row.type || 'material',
    folderId: row.folder_id || undefined,
    uploadedAt: toTimestampLike(row.uploaded_at),
  };
}

export const createMaterial = async (data: CreateMaterialDto, userId: string, userName: string): Promise<string> => {
  const { data: row, error } = await supabase
    .from(TABLE)
    .insert({
      title: data.title,
      course_code: data.courseCode,
      course_name: data.courseName,
      file_url: data.fileUrl,
      file_type: data.fileType,
      file_size: data.fileSize,
      level: data.level,
      type: data.type,
      folder_id: data.folderId,
      uploaded_by: userId,
      uploaded_by_name: userName,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating material:', errorMessage(error));
    throw error;
  }
  return row.id;
};

export const updateMaterial = async (id: string, data: UpdateMaterialDto): Promise<void> => {
  const payload: Record<string, unknown> = {};
  if (data.title !== undefined) payload.title = data.title;
  if (data.courseCode !== undefined) payload.course_code = data.courseCode;
  if (data.courseName !== undefined) payload.course_name = data.courseName;
  if (data.fileUrl !== undefined) payload.file_url = data.fileUrl;
  if (data.fileType !== undefined) payload.file_type = data.fileType;
  if (data.fileSize !== undefined) payload.file_size = data.fileSize;
  if (data.level !== undefined) payload.level = data.level;
  if (data.type !== undefined) payload.type = data.type;
  if (data.folderId !== undefined) payload.folder_id = data.folderId;

  const { error } = await supabase.from(TABLE).update(payload).eq('id', id);
  if (error) {
    console.error('Error updating material:', errorMessage(error));
    throw error;
  }
};

export const deleteMaterial = async (id: string): Promise<void> => {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) {
    console.error('Error deleting material:', errorMessage(error));
    throw error;
  }
};

export const getRecentMaterials = async (limitCount: number = 5): Promise<Material[]> => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('uploaded_at', { ascending: false })
    .limit(limitCount);

  if (error) {
    console.error('Error getting recent materials:', errorMessage(error));
    throw error;
  }
  return (data as MaterialRow[]).map(mapRow);
};

export const getAllMaterials = async (): Promise<Material[]> => {
  const { data, error } = await supabase.from(TABLE).select('*').order('uploaded_at', { ascending: false });

  if (error) {
    console.error('Error getting all materials:', errorMessage(error));
    throw error;
  }
  return (data as MaterialRow[]).map(mapRow);
};

export const getMaterialsByFolder = async (folderId: string): Promise<Material[]> => {
  const { data, error } = await supabase.from(TABLE).select('*').eq('folder_id', folderId);
  if (error) {
    console.error('Error getting materials by folder:', errorMessage(error));
    throw error;
  }
  return (data as MaterialRow[]).map(mapRow);
};
