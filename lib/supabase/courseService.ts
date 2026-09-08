import { supabase } from './config';
import { errorMessage } from './errors';
import { Course, CourseSourceType, CreateCourseDto, UpdateCourseDto, getYoutubeThumbnailUrl } from '@/types/course';

const TABLE = 'courses';

interface CourseRow {
  id: string;
  title: string;
  description: string | null;
  source_type: CourseSourceType;
  youtube_url: string | null;
  file_url: string | null;
  thumbnail_url: string | null;
  duration: string | null;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  is_published: boolean;
  folder_id: string | null;
  created_by: string | null;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

function mapRow(row: CourseRow): Course {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    sourceType: row.source_type,
    youtubeUrl: row.youtube_url || undefined,
    fileUrl: row.file_url || undefined,
    thumbnailUrl: row.thumbnail_url || '',
    duration: row.duration || '0:00',
    category: row.category,
    level: row.level,
    isPublished: row.is_published,
    folderId: row.folder_id || undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    createdBy: row.created_by || '',
    createdByName: row.created_by_name,
  };
}

export const createCourse = async (
  data: CreateCourseDto,
  userId: string,
  userName: string
): Promise<string> => {
  const { data: row, error } = await supabase
    .from(TABLE)
    .insert({
      title: data.title,
      description: data.description,
      source_type: data.sourceType,
      youtube_url: data.sourceType === 'youtube' ? data.youtubeUrl : null,
      file_url: data.sourceType === 'upload' ? data.fileUrl : null,
      thumbnail_url: data.sourceType === 'youtube' && data.youtubeUrl ? getYoutubeThumbnailUrl(data.youtubeUrl) : null,
      duration: '0:00',
      category: data.category,
      level: data.level,
      is_published: data.isPublished,
      folder_id: data.folderId || null,
      created_by: userId,
      created_by_name: userName,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating course:', errorMessage(error));
    throw error;
  }
  return row.id;
};

export const updateCourse = async (id: string, data: UpdateCourseDto): Promise<void> => {
  const payload: Record<string, unknown> = {};
  if (data.title !== undefined) payload.title = data.title;
  if (data.description !== undefined) payload.description = data.description;
  if (data.sourceType !== undefined) payload.source_type = data.sourceType;
  if (data.youtubeUrl !== undefined) {
    payload.youtube_url = data.youtubeUrl;
    if (data.youtubeUrl) payload.thumbnail_url = getYoutubeThumbnailUrl(data.youtubeUrl);
  }
  if (data.fileUrl !== undefined) payload.file_url = data.fileUrl;
  if (data.category !== undefined) payload.category = data.category;
  if (data.level !== undefined) payload.level = data.level;
  if (data.isPublished !== undefined) payload.is_published = data.isPublished;
  if (data.duration !== undefined) payload.duration = data.duration;
  if (data.thumbnailUrl !== undefined) payload.thumbnail_url = data.thumbnailUrl;
  if (data.folderId !== undefined) payload.folder_id = data.folderId || null;

  const { error } = await supabase.from(TABLE).update(payload).eq('id', id);
  if (error) {
    console.error('Error updating course:', errorMessage(error));
    throw error;
  }
};

export const deleteCourse = async (id: string): Promise<void> => {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) {
    console.error('Error deleting course:', errorMessage(error));
    throw error;
  }
};

export const getPublishedCourses = async (limitCount: number = 10): Promise<Course[]> => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(limitCount);

  if (error) {
    console.error('Error getting published courses:', errorMessage(error));
    throw error;
  }
  return (data as CourseRow[]).map(mapRow);
};

export const getAllCourses = async (limitCount: number = 100): Promise<Course[]> => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limitCount);

  if (error) {
    console.error('Error getting all courses:', errorMessage(error));
    throw error;
  }
  return (data as CourseRow[]).map(mapRow);
};
