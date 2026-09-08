'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Loader2, ShieldCheck, UserMinus, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AdminUser, findUserByEmail, getAdmins, setUserRole } from '@/lib/supabase/adminService';
import { AdminRole, ROLE_LABELS } from '@/types/roles';
import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog';

export default function ManageAdminsPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AdminRole>('pro');
  const [submitting, setSubmitting] = useState(false);

  const loadAdmins = () => {
    setLoading(true);
    getAdmins()
      .then(setAdmins)
      .catch((err) => {
        console.error('Error loading admins:', err);
        toast.error('Failed to load admin list');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSubmitting(true);
    try {
      const user = await findUserByEmail(email);
      if (!user) {
        toast.error('No account found with that email. They need to register first.');
        return;
      }
      await setUserRole(user.uid, role);
      toast.success(`${email} is now ${ROLE_LABELS[role]}`);
      setEmail('');
      loadAdmins();
    } catch (error) {
      console.error('Error promoting user:', error);
      toast.error('Failed to update role. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const [removeTarget, setRemoveTarget] = useState<AdminUser | null>(null);
  const [removing, setRemoving] = useState(false);

  const confirmRemove = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await setUserRole(removeTarget.uid, 'student');
      toast.success(`${removeTarget.email} is no longer an admin`);
      setRemoveTarget(null);
      loadAdmins();
    } catch (error) {
      console.error('Error removing admin:', error);
      toast.error('Failed to update role. Please try again.');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-5">
        <h1 className="font-display text-2xl font-bold text-foreground">Manage Admins</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Promote students to Super Admin, PRO, or Librarian by email.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-foreground">Promote a Student</h2>
        <form onSubmit={handlePromote} className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="email">Student Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as AdminRole)}>
              <SelectTrigger id="role" className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="super_admin">Super Admin</SelectItem>
                <SelectItem value="pro">PRO</SelectItem>
                <SelectItem value="librarian">Librarian</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={submitting} className="bg-accent text-accent-foreground hover:bg-accent/90">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Promote
          </Button>
        </form>
        <p className="mt-3 text-xs text-muted-foreground">
          The person must already have a student account (register at /auth/register) before they
          can be promoted.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-6 py-5">
          <h2 className="font-display text-lg font-semibold text-foreground">Current Admins</h2>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : admins.length === 0 ? (
          <div className="px-6 py-12 text-center text-muted-foreground">
            <ShieldCheck className="mx-auto mb-3 h-10 w-10" />
            No admins yet.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {admins.map((admin) => (
              <li key={admin.uid} className="flex items-center justify-between gap-4 px-6 py-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {admin.firstName ? `${admin.firstName} ${admin.lastName || ''}`.trim() : admin.email}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">{admin.email}</p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-3">
                  <Badge variant="secondary">{ROLE_LABELS[admin.role as AdminRole] || admin.role}</Badge>
                  <Button variant="outline" size="sm" onClick={() => setRemoveTarget(admin)}>
                    <UserMinus className="h-3.5 w-3.5" /> Remove
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={!!removeTarget}
        title={`Remove ${removeTarget?.email} as admin?`}
        description="They'll go back to being a regular student. You can re-promote them any time."
        confirmLabel="Remove"
        loading={removing}
        onConfirm={confirmRemove}
        onCancel={() => setRemoveTarget(null)}
      />
    </div>
  );
}
