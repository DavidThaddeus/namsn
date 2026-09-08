import { supabase } from './config';
import { errorMessage } from './errors';
import { Profile, UpdateProfileDto } from '@/types/profile';

interface ProfileRow {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  matric_number: string | null;
  department: string | null;
  level: string | null;
  phone: string | null;
  address: string | null;
  photo_url: string | null;
  role: string | null;
  last_seen_announcements_at: string | null;
}

const mapRow = (row: ProfileRow): Profile => ({
  id: row.id,
  email: row.email || '',
  firstName: row.first_name || '',
  lastName: row.last_name || '',
  matricNumber: row.matric_number || '',
  department: row.department || 'Mathematics',
  level: (row.level as Profile['level']) || '',
  phone: row.phone || '',
  address: row.address || '',
  photoURL: row.photo_url || '',
  role: (row.role as Profile['role']) || 'student',
  lastSeenAnnouncementsAt: row.last_seen_announcements_at,
});

export const getProfile = async (uid: string): Promise<Profile | null> => {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).single();

  if (error) {
    if (error.code === 'PGRST116') return null; // no matching row
    console.error('Error fetching profile:', errorMessage(error));
    throw error;
  }

  return mapRow(data as ProfileRow);
};

export const updateProfile = async (uid: string, updates: UpdateProfileDto): Promise<void> => {
  const payload: Record<string, unknown> = {};
  if (updates.firstName !== undefined) payload.first_name = updates.firstName;
  if (updates.lastName !== undefined) payload.last_name = updates.lastName;
  if (updates.matricNumber !== undefined) payload.matric_number = updates.matricNumber;
  if (updates.department !== undefined) payload.department = updates.department;
  if (updates.level !== undefined) payload.level = updates.level;
  if (updates.phone !== undefined) payload.phone = updates.phone;
  if (updates.address !== undefined) payload.address = updates.address;
  if (updates.photoURL !== undefined) payload.photo_url = updates.photoURL;
  if (updates.lastSeenAnnouncementsAt !== undefined) {
    payload.last_seen_announcements_at = updates.lastSeenAnnouncementsAt;
  }

  const { error } = await supabase.from('profiles').update(payload).eq('id', uid);

  if (error) {
    console.error('Error updating profile:', errorMessage(error));
    throw error;
  }
};

export const uploadProfilePhoto = async (uid: string, file: File): Promise<string> => {
  const { error: uploadError } = await supabase.storage
    .from('profile-photos')
    .upload(uid, file, { upsert: true, cacheControl: '3600' });

  if (uploadError) {
    console.error('Error uploading profile photo:', uploadError.message);
    throw uploadError;
  }

  const { data } = supabase.storage.from('profile-photos').getPublicUrl(uid);
  // Cache-bust: same object path gets overwritten on every re-upload, so
  // without this the browser (and CDN) would keep showing the old photo.
  return `${data.publicUrl}?updated=${Date.now()}`;
};
