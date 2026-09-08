'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Bell, Clock, FileText, GraduationCap, Wallet } from 'lucide-react';
import { Announcement } from '@/types/announcement';
import { Material } from '@/types/material';
import { getAnnouncements } from '@/lib/supabase/announcementService';
import { getRecentMaterials } from '@/lib/supabase/materialService';
import { format, formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { getProfile } from '@/lib/supabase/profileService';

export default function DashboardPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [recentMaterials, setRecentMaterials] = useState<Material[]>([]);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(true);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(true);
  const [userLevel, setUserLevel] = useState<string | null>(null);
  const [isLoadingLevel, setIsLoadingLevel] = useState(true);
  const [firstName, setFirstName] = useState<string>('');
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    let cancelled = false;
    getAnnouncements(5)
      .then((data) => {
        if (!cancelled) setAnnouncements(data);
      })
      .catch((err) => console.error('Error loading announcements:', err))
      .finally(() => {
        if (!cancelled) setIsLoadingAnnouncements(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    getRecentMaterials(5)
      .then((data) => {
        if (!cancelled) setRecentMaterials(data);
      })
      .catch((err) => console.error('Error loading materials:', err))
      .finally(() => {
        if (!cancelled) setIsLoadingMaterials(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) {
        setIsLoadingLevel(false);
        setIsLoadingUser(false);
        return;
      }

      try {
        const profile = await getProfile(currentUser.uid);
        if (profile) {
          setUserLevel(profile.level || 'Not set');
          setFirstName(profile.firstName || currentUser.displayName?.split(' ')[0] || 'Student');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setUserLevel('Error');
        setFirstName('Student');
      } finally {
        setIsLoadingLevel(false);
        setIsLoadingUser(false);
      }
    };

    fetchUserData();
  }, [currentUser]);

  const stats = [
    {
      label: 'Level',
      value: isLoadingLevel ? null : userLevel ? `${userLevel} Level` : 'Not set',
      icon: GraduationCap,
      href: '/dashboard/profile',
      linkLabel: 'View profile',
    },
    {
      label: 'Dues',
      value: null,
      icon: Wallet,
      href: '/dashboard/dues',
      linkLabel: 'Pay dues',
    },
    {
      label: 'Tutorial Timetable',
      value: null,
      icon: Clock,
      href: '/dashboard/timetable',
      linkLabel: 'View timetable',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-5">
        <h1 className="font-display text-2xl font-bold text-foreground">
          {isLoadingUser ? 'Dashboard' : `Welcome back, ${firstName}!`}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Here&apos;s what&apos;s happening in the department today.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-primary p-3">
                  <stat.icon className="h-6 w-6 text-primary-foreground" aria-hidden="true" />
                </div>
                <div className="ml-4 w-0 flex-1">
                  <p className="truncate text-sm font-medium text-muted-foreground">{stat.label}</p>
                  {stat.value !== null && (
                    <p className="text-2xl font-semibold text-foreground">
                      {stat.value ?? <span className="inline-block h-7 w-10 animate-pulse rounded bg-muted" />}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="border-t border-border bg-muted/40 px-5 py-3">
              <Link href={stat.href} className="text-sm font-medium text-secondary hover:text-primary">
                {stat.linkLabel}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Announcements */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-display text-lg font-semibold text-foreground">Recent Announcements</h2>
          <Link href="/dashboard/announcements" className="text-sm font-medium text-secondary hover:text-primary">
            View all
          </Link>
        </div>
        <div className="divide-y divide-border">
          {isLoadingAnnouncements ? (
            <div className="space-y-4 px-5 py-6">
              {[1, 2].map((i) => (
                <div key={i} className="animate-pulse space-y-2">
                  <div className="h-4 w-3/4 rounded bg-muted" />
                  <div className="h-3 w-full rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : announcements.length === 0 ? (
            <div className="px-5 py-8 text-center text-muted-foreground">No recent announcements</div>
          ) : (
            announcements.slice(0, 3).map((announcement) => (
              <div key={announcement.id} className="px-5 py-4 hover:bg-muted/40">
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-secondary/10">
                    <Bell className="h-4 w-4 text-secondary" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {announcement.title}
                        {announcement.isImportant && (
                          <span className="ml-2 bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                            Important
                          </span>
                        )}
                      </p>
                      <span className="flex-shrink-0 text-xs text-muted-foreground">
                        {format(announcement.createdAt.toDate(), 'MMM d')}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{announcement.content}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Materials */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-display text-lg font-semibold text-foreground">Recent Materials</h2>
          <Link href="/dashboard/materials" className="text-sm font-medium text-secondary hover:text-primary">
            View all materials <ArrowRight className="inline h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="px-5 py-4">
          {isLoadingMaterials ? (
            <div className="py-4 text-center text-sm text-muted-foreground">Loading materials...</div>
          ) : recentMaterials.length > 0 ? (
            <ul className="divide-y divide-border">
              {recentMaterials.map((material) => (
                <li key={material.id} className="flex items-center gap-4 py-3">
                  <FileText className="h-5 w-5 flex-shrink-0 text-muted-foreground" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{material.title}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {material.courseCode} • {material.fileType}
                      {material.level ? ` • ${material.level} Level` : ''}
                    </p>
                  </div>
                  <p className="flex-shrink-0 text-xs text-muted-foreground">
                    {material.uploadedAt
                      ? formatDistanceToNow(
                          material.uploadedAt instanceof Date ? material.uploadedAt : material.uploadedAt.toDate(),
                          { addSuffix: true }
                        )
                      : 'Unknown date'}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-8 text-center">
              <FileText className="mx-auto h-10 w-10 text-muted-foreground" aria-hidden="true" />
              <h3 className="mt-2 text-sm font-medium text-foreground">No materials available</h3>
              <p className="mt-1 text-sm text-muted-foreground">Check back later for new materials.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
