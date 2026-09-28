'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAdminRole } from '@/hooks/useAdminRole';

// Covers every /dashboard/admin/** page in one place. Without this, a
// non-admin who knows or guesses the URL still reaches these pages — each
// one's own content is already scoped correctly by permissions/RLS, but a
// student would land on a real (if empty) admin screen instead of being
// turned away. This sends them straight back to /dashboard before any admin
// page ever renders.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { role, loading } = useAdminRole();
  const isAdmin = role !== 'student';

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace('/dashboard');
    }
  }, [loading, isAdmin, router]);

  if (loading || !isAdmin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
