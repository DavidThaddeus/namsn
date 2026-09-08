export type AdminRole = 'super_admin' | 'pro' | 'librarian';
export type UserRole = 'student' | AdminRole;

export interface Permissions {
  canManageAdmins: boolean;
  canManageContent: boolean; // events + announcements
  canManageLibrary: boolean; // courses + materials
  canManageTimetable: boolean;
  canManageDues: boolean;
  canManageTeam: boolean; // executives + lecturers
}

export const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: 'Super Admin',
  pro: 'PRO',
  librarian: 'Librarian',
};

export function permissionsForRole(role: UserRole): Permissions {
  if (role === 'super_admin') {
    return {
      canManageAdmins: true,
      canManageContent: true,
      canManageLibrary: true,
      canManageTimetable: true,
      canManageDues: true,
      canManageTeam: true,
    };
  }
  if (role === 'pro') {
    return {
      canManageAdmins: false,
      canManageContent: true,
      canManageLibrary: false,
      canManageTimetable: false,
      canManageDues: false,
      canManageTeam: false,
    };
  }
  if (role === 'librarian') {
    return {
      canManageAdmins: false,
      canManageContent: false,
      canManageLibrary: true,
      canManageTimetable: false,
      canManageDues: false,
      canManageTeam: false,
    };
  }
  return {
    canManageAdmins: false,
    canManageContent: false,
    canManageLibrary: false,
    canManageTimetable: false,
    canManageDues: false,
    canManageTeam: false,
  };
}
