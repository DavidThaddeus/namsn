'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { AuthError, User as SupabaseUser } from '@supabase/supabase-js';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase/config';
import { updateProfile as updateProfileRow } from '@/lib/supabase/profileService';

// Compatibility shape: the rest of the app (21 files) reads currentUser.uid /
// .email / .displayName, a pattern carried over from Firebase's `User` type.
// Keeping this shape here means none of those files had to change when the
// backend swapped — only this file and the two spots that read the full
// profile (uid alone isn't enough there) needed touching.
export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
}

interface SignupData {
  firstName?: string;
  lastName?: string;
  matricNumber?: string;
  level?: string;
  [key: string]: unknown;
}

interface AuthContextType {
  currentUser: AppUser | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string, additionalData?: SignupData) => Promise<AppUser>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  return useContext(AuthContext) as AuthContextType;
}

// Supabase throws AuthError with a message string (codes vary by SDK
// version, so matching on message is more reliable). Normalized back to the
// same 'auth/...' codes the login/register pages already check for, so
// those two files' error-handling branches didn't need to change either.
function mapAuthError(error: Error): { code: string; message: string } {
  const msg = error.message.toLowerCase();
  if (msg.includes('invalid login credentials')) {
    return { code: 'auth/wrong-password', message: 'Invalid email or password' };
  }
  if (msg.includes('already registered') || msg.includes('already exists')) {
    return {
      code: 'auth/email-already-in-use',
      message: 'This email is already registered. Please use a different email or sign in.',
    };
  }
  if (msg.includes('password') && (msg.includes('at least') || msg.includes('too short'))) {
    return { code: 'auth/weak-password', message: 'Password should be at least 6 characters' };
  }
  if (msg.includes('unable to validate email') || msg.includes('invalid email')) {
    return { code: 'auth/invalid-email', message: 'Please enter a valid email address' };
  }
  if (msg.includes('rate limit') || msg.includes('too many')) {
    return { code: 'auth/too-many-requests', message: 'Too many attempts. Please try again later' };
  }
  return { code: 'auth/unknown', message: error.message || 'Something went wrong' };
}

function toAppUser(user: SupabaseUser): AppUser {
  return {
    uid: user.id,
    email: user.email || '',
    displayName: (user.user_metadata?.display_name as string) || '',
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const signup = async (
    email: string,
    password: string,
    displayName: string,
    additionalData?: SignupData
  ): Promise<AppUser> => {
    const toastId = toast.loading('Creating your account...');
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
            first_name: additionalData?.firstName,
            last_name: additionalData?.lastName,
          },
        },
      });

      if (error) throw error;
      if (!data.user) throw new Error('Account creation did not return a user');

      // The `handle_new_user` Postgres trigger already inserted a bare
      // profiles row (id + email) the moment auth.users got the new row —
      // fill in the rest of what the registration form collected, same as
      // the old Firestore signup wrote in one shot.
      await updateProfileRow(data.user.id, {
        firstName: additionalData?.firstName,
        lastName: additionalData?.lastName,
        matricNumber: additionalData?.matricNumber,
        level: additionalData?.level,
      });

      toast.success('Account created successfully!', { id: toastId });
      return toAppUser(data.user);
    } catch (error) {
      const { code, message } = mapAuthError(error as AuthError);
      toast.error(message, { id: toastId });
      throw Object.assign(new Error(message), { code });
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    const toastId = toast.loading('Signing in...');
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success('Signed in successfully!', { id: toastId });
    } catch (error) {
      const { code, message } = mapAuthError(error as AuthError);
      toast.error(message, { id: toastId });
      throw Object.assign(new Error(message), { code });
    }
  };

  const logout = async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Failed to sign out');
      throw error;
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    const toastId = toast.loading('Sending password reset email...');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      toast.success('Password reset email sent!', { id: toastId });
    } catch (error) {
      const { message } = mapAuthError(error as Error);
      toast.error(message, { id: toastId });
      throw error;
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ? toAppUser(session.user) : null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ? toAppUser(session.user) : null);
      setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const value: AuthContextType = {
    currentUser,
    login,
    signup,
    logout,
    resetPassword,
    loading,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}
