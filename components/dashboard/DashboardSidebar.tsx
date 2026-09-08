'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  User,
  Wallet,
  X,
} from 'lucide-react';
import { useAuth, AppUser } from '@/contexts/AuthContext';
import { getProfile } from '@/lib/supabase/profileService';
import { getAnnouncements } from '@/lib/supabase/announcementService';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Courses', href: '/dashboard/courses', icon: BookOpen },
  { name: 'Materials', href: '/dashboard/materials', icon: FileText },
  { name: 'Announcements', href: '/dashboard/announcements', icon: Bell },
  { name: 'Dues', href: '/dashboard/dues', icon: Wallet },
  { name: 'Admin Panel', href: '/dashboard/admin', icon: ShieldCheck },
  { name: 'Profile', href: '/dashboard/profile', icon: User },
];

export const SIDEBAR_COLLAPSE_KEY = 'namsn-dashboard-sidebar-collapsed';

function NavLinks({
  collapsed,
  pathname,
  hasUnreadAnnouncements,
  onNavigate,
}: {
  collapsed: boolean;
  pathname: string;
  hasUnreadAnnouncements: boolean;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex-1 space-y-1 px-2 py-4">
      {navigation.map((item) => {
        const active = pathname === item.href;
        const showDot = item.name === 'Announcements' && hasUnreadAnnouncements;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            title={collapsed ? item.name : undefined}
            className={cn(
              'relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground/70 hover:bg-muted hover:text-foreground',
              collapsed && 'justify-center px-2'
            )}
          >
            <span className="relative flex-shrink-0">
              <item.icon className="h-5 w-5" />
              {showDot && (
                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-pulse bg-accent" />
              )}
            </span>
            {!collapsed && <span>{item.name}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

function UserFooter({
  currentUser,
  collapsed,
  onLogout,
}: {
  currentUser: AppUser | null;
  collapsed: boolean;
  onLogout: () => void;
}) {
  return (
    <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
        {(currentUser?.displayName || currentUser?.email || 'S').charAt(0).toUpperCase()}
      </div>
      {!collapsed && (
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {currentUser?.displayName || 'Student'}
          </p>
          <p className="truncate text-xs text-muted-foreground">{currentUser?.email}</p>
        </div>
      )}
      <button
        onClick={onLogout}
        title="Sign out"
        aria-label="Sign out"
        className="flex-shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}

export function DashboardSidebar({
  collapsed,
  onToggleCollapsed,
}: {
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hasUnreadAnnouncements, setHasUnreadAnnouncements] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      router.push('/auth/login');
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;

    const checkUnread = async () => {
      try {
        const [latest, profile] = await Promise.all([
          getAnnouncements(1),
          getProfile(currentUser.uid),
        ]);
        if (cancelled) return;
        if (latest.length === 0) return;

        const latestTime = latest[0].createdAt.toMillis();
        const lastSeenTime = profile?.lastSeenAnnouncementsAt
          ? new Date(profile.lastSeenAnnouncementsAt).getTime()
          : 0;

        setHasUnreadAnnouncements(latestTime > lastSeenTime);
      } catch (error) {
        console.error('Error checking unread announcements:', error);
      }
    };

    checkUnread();
    return () => {
      cancelled = true;
    };
  }, [currentUser, pathname]);

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3 lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image src="/namsn.png" alt="NAMSN" width={36} height={36} />
          <span className="font-display font-semibold text-foreground">NAMSN</span>
        </Link>
        <button type="button" onClick={() => setMobileOpen(true)} aria-label="Open menu">
          <Menu className="h-6 w-6 text-foreground" />
        </button>
      </div>

      {/* Mobile slide-over */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="relative flex h-full w-72 flex-col bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                <Image src="/namsn.png" alt="NAMSN" width={36} height={36} />
                <span className="font-display font-semibold text-foreground">NAMSN</span>
              </Link>
              <button type="button" onClick={() => setMobileOpen(false)} aria-label="Close menu">
                <X className="h-6 w-6 text-foreground" />
              </button>
            </div>
            <NavLinks
              collapsed={false}
              pathname={pathname}
              hasUnreadAnnouncements={hasUnreadAnnouncements}
              onNavigate={() => setMobileOpen(false)}
            />
            <div className="border-t border-border p-4">
              <UserFooter currentUser={currentUser} collapsed={false} onLogout={handleLogout} />
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden border-r border-border bg-card transition-all duration-200 lg:fixed lg:inset-y-0 lg:flex lg:flex-col',
          collapsed ? 'lg:w-20' : 'lg:w-64'
        )}
      >
        <div className="border-b border-border">
          {!collapsed ? (
            <div className="flex items-center justify-between px-4 py-4">
              <Link href="/dashboard" className="flex items-center gap-2">
                <Image src="/namsn.png" alt="NAMSN" width={36} height={36} className="flex-shrink-0" />
                <span className="font-display font-semibold text-foreground">NAMSN</span>
              </Link>
              <button
                type="button"
                onClick={onToggleCollapsed}
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 px-2 py-4">
              <Image src="/namsn.png" alt="NAMSN" width={32} height={32} className="flex-shrink-0" />
              <button
                type="button"
                onClick={onToggleCollapsed}
                title="Expand sidebar"
                aria-label="Expand sidebar"
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
        <NavLinks collapsed={collapsed} pathname={pathname} hasUnreadAnnouncements={hasUnreadAnnouncements} />
        <div className="border-t border-border p-3">
          <UserFooter currentUser={currentUser} collapsed={collapsed} onLogout={handleLogout} />
        </div>
      </aside>
    </>
  );
}
