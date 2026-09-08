// Structurally compatible with Firestore's real Timestamp class (which has
// these two methods plus more) — narrowing the type to just what's actually
// used (.toDate()/.toMillis()) means the Supabase service can return a tiny
// shim object instead, and every consumer's existing `.toDate()` call sites
// keep compiling unchanged.
export interface TimestampLike {
  toDate: () => Date;
  toMillis: () => number;
}

export interface Announcement {
  id?: string;
  title: string;
  content: string;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
  createdBy: string; // User ID
  createdByName: string; // User display name
  isImportant: boolean;
  isRead?: boolean;
  showPostedBy: boolean;
}

export interface CreateAnnouncementDto {
  title: string;
  content: string;
  isImportant: boolean;
  showPostedBy: boolean;
}

export type UpdateAnnouncementDto = Partial<CreateAnnouncementDto>;
