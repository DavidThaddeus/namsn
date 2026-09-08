export interface CourseFolder {
  id: string;
  name: string;
  createdBy: string;
  createdAt: Date;
}

export interface CreateCourseFolderDto {
  name: string;
}
