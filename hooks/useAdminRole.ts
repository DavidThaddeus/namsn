'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getProfile } from '@/lib/supabase/profileService';
import { UserRole, permissionsForRole } from '@/types/roles';

// Real enforcement: reads the logged-in user's actual role from Supabase
// (profiles.role), gated by the RLS policies in
// supabase/migrations/003_rls_policies.sql. Replaces the temporary bypass
// that treated every logged-in user as super_admin while the app ran on a
// Firebase project nobody had Console access to.
export function useAdminRole() {
  const { currentUser, loading: authLoading } = useAuth();
  const [role, setRole] = useState<UserRole>('student');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!currentUser) {
      setRole('student');
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    getProfile(currentUser.uid)
      .then((profile) => {
        if (!cancelled) setRole(profile?.role || 'student');
      })
      .catch((error) => {
        console.error('Error fetching role:', error);
        if (!cancelled) setRole('student');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentUser, authLoading]);

  return {
    role,
    permissions: permissionsForRole(role),
    loading: authLoading || loading,
  };
}
