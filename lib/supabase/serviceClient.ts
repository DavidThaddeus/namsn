import { createClient } from '@supabase/supabase-js';

// Server-only: bypasses RLS entirely using the service_role key. Never import
// this from a 'use client' component or anywhere that could ship it to the
// browser — only from Route Handlers (app/api/**/route.ts).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseService = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
