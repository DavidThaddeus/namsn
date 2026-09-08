import { supabase } from './config';
import { errorMessage } from './errors';
import { Announcement, CreateAnnouncementDto, UpdateAnnouncementDto } from '@/types/announcement';

const TABLE = 'announcements';

function toTimestampLike(iso: string) {
  const date = new Date(iso);
  return {
    toDate: () => date,
    toMillis: () => date.getTime(),
  };
}

interface AnnouncementRow {
  id: string;
  title: string;
  content: string;
  is_important: boolean;
  show_posted_by: boolean;
  created_by: string | null;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

function mapRow(row: AnnouncementRow): Announcement {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    isImportant: row.is_important,
    showPostedBy: row.show_posted_by,
    createdBy: row.created_by || '',
    createdByName: row.created_by_name,
    createdAt: toTimestampLike(row.created_at),
    updatedAt: toTimestampLike(row.updated_at),
  };
}

export const createAnnouncement = async (
  data: CreateAnnouncementDto,
  userId: string,
  userName: string
): Promise<string> => {
  const { data: row, error } = await supabase
    .from(TABLE)
    .insert({
      title: data.title,
      content: data.content,
      is_important: data.isImportant,
      show_posted_by: data.showPostedBy,
      created_by: userId,
      created_by_name: userName,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating announcement:', errorMessage(error));
    throw error;
  }
  return row.id;
};

export const updateAnnouncement = async (id: string, data: UpdateAnnouncementDto): Promise<void> => {
  const payload: Record<string, unknown> = {};
  if (data.title !== undefined) payload.title = data.title;
  if (data.content !== undefined) payload.content = data.content;
  if (data.isImportant !== undefined) payload.is_important = data.isImportant;
  if (data.showPostedBy !== undefined) payload.show_posted_by = data.showPostedBy;

  const { error } = await supabase.from(TABLE).update(payload).eq('id', id);
  if (error) {
    console.error('Error updating announcement:', errorMessage(error));
    throw error;
  }
};

export const deleteAnnouncement = async (id: string): Promise<void> => {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) {
    console.error('Error deleting announcement:', errorMessage(error));
    throw error;
  }
};

export const getAnnouncements = async (limitCount: number = 10): Promise<Announcement[]> => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limitCount);

  if (error) {
    console.error('Error getting announcements:', errorMessage(error));
    throw error;
  }
  return (data as AnnouncementRow[]).map(mapRow);
};

export const getImportantAnnouncements = async (limitCount: number = 5): Promise<Announcement[]> => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('is_important', true)
    .order('created_at', { ascending: false })
    .limit(limitCount);

  if (error) {
    console.error('Error getting important announcements:', errorMessage(error));
    throw error;
  }
  return (data as AnnouncementRow[]).map(mapRow);
};
