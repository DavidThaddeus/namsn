import { MaterialLevel, MaterialType } from './material';

export interface MaterialFolder {
  id: string;
  name: string;
  level: MaterialLevel;
  type: MaterialType; // 'material' = a course folder, 'past_question' = Past Questions
  createdAt: Date;
  createdBy: string;
}

export interface CreateMaterialFolderDto {
  name: string;
  level: MaterialLevel;
  type: MaterialType;
}
