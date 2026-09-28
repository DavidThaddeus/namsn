'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

export default function ResetPasswordPage() {
  const router = useRouter();
  // 'checking' -> 'ready' (recovery link verified, show the form) or
  // 'invalid' (no/expired recovery session — someone landed here without
  // clicking a real reset link).
  const [status, setStatus] = useState<'checking' | 'ready' | 'invalid'>('checking');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // The reset-link redirect carries a recovery token in the URL that the
    // Supabase client parses automatically on load and turns into a real
    // (if temporary) session, firing PASSWORD_RECOVERY once that's done.
    // We still also check getSession() directly in case that event already
    // fired before this listener was attached.
    let settled = false;
    const settle = (hasSession: boolean) => {
      if (settled) return;
      settled = true;
      setStatus(hasSession ? 'ready' : 'invalid');
    };

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') settle(true);
      else if (event === 'SIGNED_IN' && session) settle(true);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) settle(true);
    });

    // Give the token a moment to be parsed before concluding there isn't one.
    const timer = setTimeout(() => settle(false), 2500);

    return () => {
      listener.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password should be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading('Updating your password...');
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      toast.success('Password updated! You are now signed in.', { id: toastId });
      router.push('/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update password';
      toast.error(message, { id: toastId });
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4 py-12">
      <Link href="/" className="mb-8 flex flex-col items-center gap-3">
        <Image src="/namsn.png" alt="NAMSN Logo" width={56} height={56} />
        <span className="font-display text-xl font-semibold text-foreground">NAMSN FUNAAB</span>
      </Link>

      <Card className="w-full max-w-md">
        <CardContent>
          {status === 'checking' && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Verifying your reset link...</p>
            </div>
          )}

          {status === 'invalid' && (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <h1 className="font-display text-2xl font-semibold text-foreground">Link expired or invalid</h1>
              <p className="text-sm text-muted-foreground">
                This password reset link is no longer valid — reset links only work once and expire after a
                while. Request a new one below.
              </p>
              <Link
                href="/auth/forgot-password"
                className="mt-2 bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90"
              >
                Request a new link
              </Link>
            </div>
          )}

          {status === 'ready' && (
            <>
              <h1 className="font-display text-center text-2xl font-semibold text-foreground">
                Set a new password
              </h1>
              <p className="mt-1 text-center text-sm text-muted-foreground">
                Choose a new password for your account.
              </p>

              {error && (
                <div className="mt-6 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      className="pr-10"
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    placeholder="Re-enter your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Updating...
                    </>
                  ) : (
                    'Update password'
                  )}
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
