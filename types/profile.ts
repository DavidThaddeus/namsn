import { UserRole } from './roles';

export interface Profile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  matricNumber: string;
  department: string;
  level: '100' | '200' | '300' | '400' | '';
  phone: string;
  address: string;
  photoURL: string;
  role: UserRole;
  lastSeenAnnouncementsAt: string | null;
}

export interface UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  matricNumber?: string;
  department?: string;
  level?: string;
  phone?: string;
  address?: string;
  photoURL?: string;
  lastSeenAnnouncementsAt?: string;
}
