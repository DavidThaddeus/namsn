import { TimestampLike } from './announcement';

export type MaterialLevel = '100' | '200' | '300' | '400';
export type MaterialType = 'material' | 'past_question';

export interface Material {
  id: string;
  title: string;
  courseCode: string;
  courseName: string;
  fileUrl: string;
  fileType: string;
  fileSize: string;
  level?: MaterialLevel;
  type?: MaterialType;
  folderId?: string;
  uploadedAt: Date | TimestampLike;
}

export interface CreateMaterialDto {
  title: string;
  courseCode: string;
  courseName: string;
  fileUrl: string;
  fileType: string;
  fileSize: string;
  level?: MaterialLevel;
  type?: MaterialType;
  folderId?: string;
}

export interface UpdateMaterialDto {
  title?: string;
  courseCode?: string;
  courseName?: string;
  fileUrl?: string;
  fileType?: string;
  fileSize?: string;
  level?: MaterialLevel;
  type?: MaterialType;
  folderId?: string;
}
