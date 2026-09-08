import { supabase } from './config';
import { errorMessage } from './errors';
import { AdminRole, UserRole } from '@/types/roles';

const ADMIN_ROLES: AdminRole[] = ['super_admin', 'pro', 'librarian'];

export interface AdminUser {
  uid: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
}

interface ProfileRow {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  role: string | null;
}

const mapRow = (row: ProfileRow): AdminUser => ({
  uid: row.id,
  email: row.email || '',
  firstName: row.first_name || undefined,
  lastName: row.last_name || undefined,
  role: (row.role as UserRole) || 'student',
});

export const getAdmins = async (): Promise<AdminUser[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name, role')
    .in('role', ADMIN_ROLES);

  if (error) {
    console.error('Error getting admins:', errorMessage(error));
    throw error;
  }
  return (data as ProfileRow[]).map(mapRow);
};

export const findUserByEmail = async (email: string): Promise<AdminUser | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name, role')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle();

  if (error) {
    console.error('Error finding user by email:', errorMessage(error));
    throw error;
  }
  return data ? mapRow(data as ProfileRow) : null;
};

export const setUserRole = async (uid: string, role: UserRole): Promise<void> => {
  const { error } = await supabase.from('profiles').update({ role }).eq('id', uid);
  if (error) {
    console.error('Error setting user role:', errorMessage(error));
    throw error;
  }
};
