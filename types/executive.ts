export interface Executive {
  id: string;
  name: string;
  role: string;
  imageUrl: string;
  bio: string;
  sortOrder: number;
}

export interface CreateExecutiveDto {
  name: string;
  role: string;
  imageUrl: string;
  bio: string;
  sortOrder?: number;
}

export type UpdateExecutiveDto = Partial<CreateExecutiveDto>;
