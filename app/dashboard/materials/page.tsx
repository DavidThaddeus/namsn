'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getProfile } from '@/lib/supabase/profileService';
import { getAllMaterials } from '@/lib/supabase/materialService';
import { Material, MaterialLevel, MaterialType } from '@/types/material';
import { ChevronDown, ChevronRight, Download, FileText, Folder, Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const LEVELS: MaterialLevel[] = ['100', '200', '300', '400'];

type LevelFilter = 'mine' | MaterialLevel | 'all';
type TypeFilter = 'all' | MaterialType;

export default function MaterialsPage() {
  const { currentUser } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());
  const [userLevel, setUserLevel] = useState<MaterialLevel | null>(null);
  const [filter, setFilter] = useState<LevelFilter>('mine');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  useEffect(() => {
    let cancelled = false;
    getAllMaterials()
      .then((data) => {
        if (!cancelled) setMaterials(data);
      })
      .catch((err) => console.error('Error fetching materials:', err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const fetchLevel = async () => {
      if (!currentUser) return;
      try {
        const profile = await getProfile(currentUser.uid);
        if (profile?.level) {
          setUserLevel(profile.level as MaterialLevel);
        }
      } catch (error) {
        console.error('Error fetching user level:', error);
      }
    };
    fetchLevel();
  }, [currentUser]);

  const toggleCourse = (courseCode: string) => {
    setExpandedCourses((prev) => {
      const next = new Set(prev);
      if (next.has(courseCode)) {
        next.delete(courseCode);
      } else {
        next.add(courseCode);
      }
      return next;
    });
  };

  const handleDownload = (fileUrl: string) => {
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
  };

  const levelFiltered = useMemo(() => {
    if (filter === 'all') return materials;
    if (filter === 'mine') {
      return materials.filter((m) => !m.level || m.level === userLevel);
    }
    return materials.filter((m) => m.level === filter);
  }, [materials, filter, userLevel]);

  const typeFiltered =
    typeFilter === 'all' ? levelFiltered : levelFiltered.filter((m) => (m.type || 'material') === typeFilter);

  const filteredMaterials = typeFiltered.filter(
    (m) =>
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.courseName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const materialsByCourse = filteredMaterials.reduce((acc, material) => {
    if (!acc[material.courseCode]) acc[material.courseCode] = [];
    acc[material.courseCode].push(material);
    return acc;
  }, {} as Record<string, Material[]>);

  const courses = Array.from(
    filteredMaterials
      .reduce((map, material) => {
        if (!map.has(material.courseCode)) {
          map.set(material.courseCode, { code: material.courseCode, name: material.courseName });
        }
        return map;
      }, new Map<string, { code: string; name: string }>())
      .values()
  );

  const filterTabs: { label: string; value: LevelFilter }[] = [
    { label: userLevel ? `My Level (${userLevel})` : 'My Level', value: 'mine' },
    ...LEVELS.filter((l) => l !== userLevel).map((l) => ({ label: `${l} Level`, value: l as LevelFilter })),
    { label: 'All Levels', value: 'all' },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-5">
        <h1 className="font-display text-2xl font-bold text-foreground">Course Materials</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {userLevel
            ? `Showing materials for your level (${userLevel} Level) by default — browse other levels below.`
            : 'Access and download your course materials and resources.'}
        </p>
      </div>

      {/* Level tabs */}
      <div className="flex flex-wrap gap-2">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setFilter(tab.value)}
            className={cn(
              'px-4 py-1.5 text-sm font-medium transition-colors',
              filter === tab.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Type filter */}
      <div className="flex flex-wrap gap-2">
        {([
          { label: 'All', value: 'all' },
          { label: 'Course Materials', value: 'material' },
          { label: 'Past Questions', value: 'past_question' },
        ] as { label: string; value: TypeFilter }[]).map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setTypeFilter(tab.value)}
            className={cn(
              'px-4 py-1.5 text-sm font-medium transition-colors',
              typeFilter === tab.value
                ? 'bg-secondary text-secondary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          className="pl-10"
          placeholder="Search materials..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Materials List */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {Object.entries(materialsByCourse).length > 0 ? (
          <ul className="divide-y divide-border">
            {Object.entries(materialsByCourse).map(([courseCode, courseMaterials]) => {
              const course = courses.find((c) => c.code === courseCode);
              const isExpanded = expandedCourses.has(courseCode);

              return (
                <li key={courseCode}>
                  <button
                    type="button"
                    onClick={() => toggleCourse(courseCode)}
                    className="w-full px-5 py-4 text-left hover:bg-muted/40"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Folder className="mr-3 h-5 w-5 flex-shrink-0 text-muted-foreground" />
                        <div>
                          <h3 className="text-sm font-medium text-foreground">
                            {course?.name || courseCode} ({courseCode})
                          </h3>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {courseMaterials.length} {courseMaterials.length === 1 ? 'item' : 'items'}
                          </p>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <ul className="space-y-1 bg-muted/30 py-2 pl-12 pr-5">
                      {courseMaterials.map((material) => (
                        <li key={material.id} className="flex items-center justify-between border-t border-border py-3 first:border-t-0">
                          <div className="flex items-center">
                            <FileText className="mr-2 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-foreground">{material.title}</p>
                                {material.type === 'past_question' && (
                                  <Badge variant="secondary">Past Question</Badge>
                                )}
                              </div>
                              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{material.fileType?.toUpperCase() || 'FILE'}</span>
                                <span>•</span>
                                <span>{material.fileSize || 'N/A'}</span>
                                {material.level && (
                                  <>
                                    <span>•</span>
                                    <span>{material.level} Level</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(material.fileUrl);
                            }}
                            className="ml-4 inline-flex items-center gap-1 rounded-md bg-secondary/10 px-3 py-1.5 text-xs font-medium text-secondary hover:bg-secondary/20"
                          >
                            <Download className="h-3 w-3" />
                            Download
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="py-12 text-center">
            <Folder className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-medium text-foreground">No materials found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchTerm ? 'Try a different search term.' : 'No materials available for this view yet.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
