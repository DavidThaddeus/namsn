'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Course, extractYoutubeId } from '@/types/course';
import { getPublishedCourses } from '@/lib/supabase/courseService';
import { getCourseFolders } from '@/lib/supabase/courseFolderService';
import { CourseFolder } from '@/types/courseFolder';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BookOpen, Clock, Folder, Loader2, PlayCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type FolderTile = { id: string; name: string; courses: Course[] };

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [folders, setFolders] = useState<CourseFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState<FolderTile | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getPublishedCourses(200), getCourseFolders()])
      .then(([coursesData, foldersData]) => {
        if (!cancelled) {
          setCourses(coursesData);
          setFolders(foldersData);
        }
      })
      .catch((err) => {
        console.error('Error loading courses:', err);
        if (!cancelled) setError('Some courses may be unavailable right now.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course);
    setTimeout(() => {
      document.getElementById('course-player')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const openFolder = (tile: FolderTile) => {
    setSelectedCourse(null);
    setSelectedFolder(tile);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const tiles: FolderTile[] = [
    ...folders.map((folder) => ({ id: folder.id, name: folder.name, courses: courses.filter((c) => c.folderId === folder.id) })),
    { id: 'uncategorized', name: 'Other Courses', courses: courses.filter((c) => !c.folderId) },
  ].filter((tile) => tile.courses.length > 0);

  const renderCourseCard = (course: Course) => (
    <div
      key={course.id}
      onClick={() => handleCourseSelect(course)}
      className={cn(
        'cursor-pointer overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md',
        selectedCourse?.id === course.id && 'ring-2 ring-accent'
      )}
    >
      <div className="group relative aspect-video bg-muted">
        {course.thumbnailUrl && (
          <Image
            src={course.thumbnailUrl}
            alt={course.title}
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            unoptimized
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <PlayCircle className="h-12 w-12 text-white" />
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{course.category || 'General'}</Badge>
          <Badge variant="outline">{course.level}</Badge>
        </div>
        <h3 className="font-display mt-3 text-lg font-semibold leading-tight text-foreground line-clamp-2">
          {course.title}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{course.description}</p>
        <div className="mt-4 flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{course.duration || '0:00'}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {selectedFolder && (
        <button
          type="button"
          onClick={() => { setSelectedFolder(null); setSelectedCourse(null); }}
          className="flex items-center gap-1 text-sm font-medium text-secondary hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Back to categories
        </button>
      )}

      <div className="border-b border-border pb-5">
        <h1 className="font-display text-2xl font-bold text-foreground">
          {selectedFolder ? selectedFolder.name : 'Courses'}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {selectedFolder ? 'Available course videos in this category.' : 'Browse available course categories.'}
        </p>
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </div>

      {courses.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-border py-12 text-center">
          <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-medium text-foreground">No courses available</h3>
          <p className="mt-1 text-sm text-muted-foreground">Check back later for new courses</p>
        </div>
      ) : !selectedFolder ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tiles.map((tile) => (
            <button
              key={tile.id}
              type="button"
              onClick={() => openFolder(tile)}
              className="flex flex-col items-start gap-3 rounded-xl border border-border bg-card p-6 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex h-11 w-11 items-center justify-center bg-primary text-primary-foreground">
                <Folder className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-foreground">{tile.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {tile.courses.length} course{tile.courses.length === 1 ? '' : 's'}
                </p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {selectedFolder.courses.map(renderCourseCard)}
        </div>
      )}

      {selectedCourse && (
        <div id="course-player" className="space-y-4">
          <h2 className="font-display text-xl font-semibold text-foreground">{selectedCourse.title}</h2>
          {selectedCourse.sourceType === 'youtube' && selectedCourse.youtubeUrl && extractYoutubeId(selectedCourse.youtubeUrl) ? (
            <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${extractYoutubeId(selectedCourse.youtubeUrl)}`}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={selectedCourse.title}
              />
            </div>
          ) : selectedCourse.sourceType === 'upload' && selectedCourse.fileUrl ? (
            selectedCourse.fileUrl.toLowerCase().endsWith('.pdf') ? (
              <div className="aspect-video w-full overflow-hidden rounded-xl border border-border bg-muted">
                <iframe src={selectedCourse.fileUrl} className="h-full w-full" title={selectedCourse.title} />
              </div>
            ) : (
              <video controls className="aspect-video w-full rounded-xl bg-black" src={selectedCourse.fileUrl} />
            )
          ) : (
            <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-muted">
              <div className="text-center text-muted-foreground">
                <PlayCircle className="mx-auto mb-2 h-12 w-12 opacity-50" />
                <p>This course has no playable content.</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {selectedCourse.level && <Badge variant="outline">{selectedCourse.level}</Badge>}
            <span>{selectedCourse.duration || '0:00'}</span>
          </div>
          <p className="text-muted-foreground">{selectedCourse.description}</p>
          <Button variant="outline" onClick={() => setSelectedCourse(null)}>
            Close player
          </Button>
        </div>
      )}
    </div>
  );
}
