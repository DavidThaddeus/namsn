'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await resetPassword(email);
      // Always show the same success state regardless of whether the email
      // is actually registered — confirming or denying that here would let
      // anyone enumerate which emails have accounts.
      setSent(true);
    } catch {
      // resetPassword already toasts the error; nothing else to do here.
    } finally {
      setLoading(false);
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
          {sent ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle2 className="h-10 w-10 text-primary" />
              <h1 className="font-display text-2xl font-semibold text-foreground">Check your email</h1>
              <p className="text-sm text-muted-foreground">
                If an account exists for <span className="font-medium text-foreground">{email}</span>, we&apos;ve
                sent a link to reset your password. It may take a few minutes to arrive — check your spam
                folder too.
              </p>
              <Link href="/auth/login" className="mt-2 text-sm font-medium text-secondary hover:text-primary">
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h1 className="font-display text-center text-2xl font-semibold text-foreground">
                Forgot your password?
              </h1>
              <p className="mt-1 text-center text-sm text-muted-foreground">
                Enter your email and we&apos;ll send you a link to reset it.
              </p>

              <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Sending...
                    </>
                  ) : (
                    'Send reset link'
                  )}
                </Button>
              </form>

              <div className="mt-6 border-t border-border pt-6 text-center text-sm text-muted-foreground">
                <Link href="/auth/login" className="font-medium text-secondary hover:text-primary">
                  Back to sign in
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
