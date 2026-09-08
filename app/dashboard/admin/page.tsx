'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Bell,
  BookOpen,
  CalendarClock,
  FileText,
  GraduationCap,
  ShieldCheck,
  Users,
  Wallet,
} from 'lucide-react';
import { useAdminRole } from '@/hooks/useAdminRole';
import { ROLE_LABELS } from '@/types/roles';

const sections = [
  {
    title: 'Manage Admins',
    description: 'Promote or remove Super Admins, PROs, and Librarians.',
    href: '/dashboard/admin/admins',
    icon: Users,
    restrictedTo: 'Super Admin',
    show: (p: ReturnType<typeof useAdminRole>['permissions']) => p.canManageAdmins,
  },
  {
    title: 'Events',
    description: 'Create, edit, and remove departmental events.',
    href: '/dashboard/admin/events',
    icon: CalendarClock,
    restrictedTo: 'Super Admin, PRO',
    show: (p: ReturnType<typeof useAdminRole>['permissions']) => p.canManageContent,
  },
  {
    title: 'Announcements',
    description: 'Publish and manage departmental announcements.',
    href: '/dashboard/admin/announcements',
    icon: Bell,
    restrictedTo: 'Super Admin, PRO',
    show: (p: ReturnType<typeof useAdminRole>['permissions']) => p.canManageContent,
  },
  {
    title: 'Courses',
    description: 'Add and manage learning courses and videos.',
    href: '/dashboard/admin/courses',
    icon: BookOpen,
    restrictedTo: 'Super Admin, Librarian',
    show: (p: ReturnType<typeof useAdminRole>['permissions']) => p.canManageLibrary,
  },
  {
    title: 'Materials',
    description: 'Upload course materials and past questions by level.',
    href: '/dashboard/admin/materials',
    icon: FileText,
    restrictedTo: 'Super Admin, Librarian',
    show: (p: ReturnType<typeof useAdminRole>['permissions']) => p.canManageLibrary,
  },
  {
    title: 'Tutorial Timetable',
    description: 'Edit the tutorial timetable for each level.',
    href: '/dashboard/admin/timetable',
    icon: CalendarClock,
    restrictedTo: 'Super Admin',
    show: (p: ReturnType<typeof useAdminRole>['permissions']) => p.canManageTimetable,
  },
  {
    title: 'Dues Records',
    description: "Search any student's payment request and mark dues as paid.",
    href: '/dashboard/admin/dues',
    icon: Wallet,
    restrictedTo: 'Super Admin',
    show: (p: ReturnType<typeof useAdminRole>['permissions']) => p.canManageDues,
  },
  {
    title: 'Executive Council',
    description: 'Add, edit, or remove executives and positions shown on the home page.',
    href: '/dashboard/admin/executives',
    icon: Users,
    restrictedTo: 'Super Admin',
    show: (p: ReturnType<typeof useAdminRole>['permissions']) => p.canManageTeam,
  },
  {
    title: 'Lecturers',
    description: 'Add, edit, or remove lecturers shown on the Staff page.',
    href: '/dashboard/admin/lecturers',
    icon: GraduationCap,
    restrictedTo: 'Super Admin',
    show: (p: ReturnType<typeof useAdminRole>['permissions']) => p.canManageTeam,
  },
];

export default function AdminOverviewPage() {
  const { role, permissions } = useAdminRole();
  const visibleSections = sections.filter((s) => s.show(permissions));

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-secondary" />
          <h1 className="font-display text-2xl font-bold text-foreground">Admin Panel</h1>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Signed in as <span className="font-medium text-foreground">{ROLE_LABELS[role as keyof typeof ROLE_LABELS] || role}</span>.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visibleSections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
          >
            <div className="flex h-11 w-11 items-center justify-center bg-primary text-primary-foreground">
              <section.icon className="h-5 w-5" />
            </div>
            <h3 className="font-display mt-4 text-lg font-semibold text-foreground">{section.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{section.description}</p>
            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-secondary">
              {section.restrictedTo}
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-secondary">
              Open <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
