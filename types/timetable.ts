export type TimetableLevel = '100' | '200' | '300' | '400';
export type TimetableMode = 'rows' | 'image';

export interface TimetableRow {
  id: string;
  day: string;
  time: string;
  course: string;
  tutor: string;
  venue: string;
}

export interface Timetable {
  level: TimetableLevel;
  mode: TimetableMode;
  rows: TimetableRow[];
  imageUrl?: string;
  updatedAt: Date;
}
