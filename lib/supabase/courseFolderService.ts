import { supabase } from './config';
import { errorMessage } from './errors';
import { CourseFolder, CreateCourseFolderDto } from '@/types/courseFolder';

const TABLE = 'course_folders';

interface CourseFolderRow {
  id: string;
  name: string;
  created_by: string | null;
  created_at: string;
}

function mapRow(row: CourseFolderRow): CourseFolder {
  return {
    id: row.id,
    name: row.name,
    createdBy: row.created_by || '',
    createdAt: new Date(row.created_at),
  };
}

export const createCourseFolder = async (data: CreateCourseFolderDto, userId: string): Promise<string> => {
  const { data: row, error } = await supabase
    .from(TABLE)
    .insert({ name: data.name, created_by: userId })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating course folder:', errorMessage(error));
    throw error;
  }
  return row.id;
};

export const getCourseFolders = async (): Promise<CourseFolder[]> => {
  const { data, error } = await supabase.from(TABLE).select('*').order('created_at', { ascending: true });
  if (error) {
    console.error('Error getting course folders:', errorMessage(error));
    throw error;
  }
  return (data as CourseFolderRow[]).map(mapRow);
};

export const deleteCourseFolder = async (id: string): Promise<void> => {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) {
    console.error('Error deleting course folder:', errorMessage(error));
    throw error;
  }
};
