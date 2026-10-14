'use client';

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAdminRole } from '@/hooks/useAdminRole';
import {
  PaymentSplit,
  SplitRecipient,
  getPaymentSplits,
  setSplitsStatus,
} from '@/lib/supabase/paymentSplitService';

const formatNaira = (amount: number) =>
  `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const RECIPIENT_LABEL: Record<SplitRecipient, string> = {
  department: 'NAMSN (dues)',
  developer: 'Developer (service fee)',
};

export default function AdminPayoutsPage() {
  const { permissions } = useAdminRole();
  const [splits, setSplits] = useState<PaymentSplit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<SplitRecipient | 'all'>('developer');
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    getPaymentSplits()
      .then(setSplits)
      .catch((err) => {
        console.error('Error loading payouts:', err);
        toast.error('Failed to load payouts');
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const totals = useMemo(() => {
    const sum = (r: SplitRecipient, s: PaymentSplit['status']) =>
      splits.filter((x) => x.recipient === r && x.status === s).reduce((t, x) => t + x.amount, 0);
    return (['developer', 'department'] as SplitRecipient[]).map((r) => ({
      recipient: r,
      owed: sum(r, 'pending'),
      sent: sum(r, 'sent'),
    }));
  }, [splits]);

  const visible = splits.filter((s) => filter === 'all' || s.recipient === filter);
  const pendingIds = visible.filter((s) => s.status === 'pending').map((s) => s.id);

  const update = async (ids: string[], status: PaymentSplit['status'], message: string) => {
    setBusy(true);
    try {
      await setSplitsStatus(ids, status);
      toast.success(message);
      load();
    } catch (error) {
      console.error('Error updating payouts:', error);
      toast.error('Update failed');
    } finally {
      setBusy(false);
    }
  };

  if (!permissions.canManageDues) {
    return <p className="text-sm text-muted-foreground">Only the Super Admin can view payouts.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-5">
        <h1 className="font-display text-2xl font-bold text-foreground">Payouts</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Every dues payment lands in the NAMSN Bachs account. This ledger shows how much of it
          belongs to each party (after Bachs&apos;s 1.5% fee) so the developer share can be paid out
          and ticked off here.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {totals.map((t) => (
          <div key={t.recipient} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">{RECIPIENT_LABEL[t.recipient]}</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{formatNaira(t.owed)}</p>
            <p className="text-xs text-muted-foreground">owed · {formatNaira(t.sent)} already paid out</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(['developer', 'department', 'all'] as const).map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? 'default' : 'outline'}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : RECIPIENT_LABEL[f]}
          </Button>
        ))}
        <Button
          size="sm"
          className="ml-auto bg-accent text-accent-foreground hover:bg-accent/90"
          disabled={busy || pendingIds.length === 0}
          onClick={() => update(pendingIds, 'sent', `Marked ${pendingIds.length} as paid out`)}
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Mark all shown as paid out ({pendingIds.length})
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : visible.length === 0 ? (
          <div className="px-6 py-12 text-center text-muted-foreground">No payouts recorded yet.</div>
        ) : (
          <ul className="divide-y divide-border">
            {visible.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{s.fullName}</p>
                    <Badge variant="outline" className="font-mono">{s.reference}</Badge>
                    <Badge variant="secondary">{RECIPIENT_LABEL[s.recipient]}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {format(s.createdAt, 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-3">
                  <span className="text-sm font-semibold text-foreground">{formatNaira(s.amount)}</span>
                  {s.status === 'pending' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => update([s.id], 'sent', 'Marked as paid out')}
                    >
                      Mark paid out
                    </Button>
                  ) : (
                    <Badge variant={s.status === 'sent' ? 'secondary' : 'destructive'}>
                      {s.status === 'sent' ? 'Paid out' : 'Failed'}
                    </Badge>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
