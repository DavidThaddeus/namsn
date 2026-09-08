export interface Lecturer {
  id: string;
  name: string;
  title: string;
  specialization: string;
  imageUrl: string;
  sortOrder: number;
}

export interface CreateLecturerDto {
  name: string;
  title: string;
  specialization: string;
  imageUrl: string;
  sortOrder?: number;
}

export type UpdateLecturerDto = Partial<CreateLecturerDto>;
