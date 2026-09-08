export type CourseSourceType = 'youtube' | 'upload';

export interface Course {
  id: string;
  title: string;
  description: string;
  sourceType: CourseSourceType;
  youtubeUrl?: string;
  fileUrl?: string;
  thumbnailUrl: string;
  duration: string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  isPublished: boolean;
  folderId?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  createdByName: string;
}

export interface CreateCourseDto {
  title: string;
  description: string;
  sourceType: CourseSourceType;
  youtubeUrl?: string;
  fileUrl?: string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  isPublished: boolean;
  folderId?: string;
}

export interface UpdateCourseDto extends Partial<CreateCourseDto> {
  thumbnailUrl?: string;
  duration?: string;
}

// Helper function to extract YouTube video ID from URL
export function extractYoutubeId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// Helper function to generate YouTube embed URL
export function getYoutubeEmbedUrl(url: string): string {
  const videoId = extractYoutubeId(url);
  return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
}

// Helper function to get YouTube thumbnail URL
export function getYoutubeThumbnailUrl(url: string, quality: 'default' | 'mqdefault' | 'hqdefault' | 'sddefault' | 'maxresdefault' = 'hqdefault'): string {
  const videoId = extractYoutubeId(url);
  return videoId ? `https://img.youtube.com/vi/${videoId}/${quality}.jpg` : '';
}
