'use client';

import { use, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase/config';
import { findDuesRequests } from '@/lib/supabase/duesService';
import { DuesRequest } from '@/types/dues';

const formatNaira = (amount: number) => `₦${amount.toLocaleString('en-NG')}`;

export default function InvoicePage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = use(params);
  const [dues, setDues] = useState<DuesRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [payingNow, setPayingNow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    findDuesRequests({ reference })
      .then((data) => !cancelled && setDues(data[0] || null))
      .catch((err) => console.error('Error loading invoice:', err))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [reference]);

  const handlePayNow = async () => {
    if (!dues) return;
    setPayingNow(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        toast.error('Please log in again to pay.');
        return;
      }

      const res = await fetch('/api/dues/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ duesRequestId: dues.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start payment');

      window.location.href = data.checkoutUrl;
    } catch (error) {
      console.error('Error starting payment:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start payment. Please try again.');
    } finally {
      setPayingNow(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!dues) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <p className="text-lg font-medium text-foreground">Invoice not found</p>
        <p className="mt-1 text-sm text-muted-foreground">No record found for that reference.</p>
      </div>
    );
  }

  if (dues.paymentStatus === 'paid') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <p className="text-lg font-medium text-foreground">This invoice is already paid</p>
        <Link
          href={`/dashboard/dues/receipt/${dues.reference}`}
          className="mt-2 text-sm font-medium text-primary underline underline-offset-2"
        >
          View Receipt instead
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="font-display text-2xl font-bold text-foreground">Invoice</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print
          </Button>
          <Button
            onClick={handlePayNow}
            disabled={payingNow}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {payingNow && <Loader2 className="h-4 w-4 animate-spin" />}
            Pay {formatNaira(dues.totalAmount)} Now
          </Button>
        </div>
      </div>

      <div className="relative mx-auto max-w-2xl overflow-hidden rounded-2xl border border-border bg-card p-10 shadow-sm print:rounded-none print:border-0 print:shadow-none">
        {/* Watermark */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
        >
          <span className="rotate-[-30deg] whitespace-nowrap text-6xl font-bold uppercase tracking-widest text-destructive/[0.06] print:text-destructive/10">
            NAMSN FUNAAB · UNPAID
          </span>
        </div>

        <div className="relative">
          <div className="flex items-center justify-between border-b border-border pb-6">
            <div className="flex items-center gap-3">
              <Image src="/namsn.png" alt="NAMSN" width={48} height={48} />
              <div>
                <p className="font-display text-lg font-bold text-foreground">NAMSN FUNAAB</p>
                <p className="text-xs text-muted-foreground">Department of Mathematics, FUNAAB</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-foreground">Payment Invoice</h2>
            <span className="bg-destructive px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
              Unpaid
            </span>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-y-4 text-sm">
            <div>
              <p className="text-muted-foreground">Name</p>
              <p className="font-medium text-foreground">{dues.fullName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Email</p>
              <p className="font-medium text-foreground">{dues.email}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Matric Number</p>
              <p className="font-medium text-foreground">{dues.matricNumber}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Level</p>
              <p className="font-medium text-foreground">{dues.level}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <p className="font-medium text-foreground">{dues.status}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Reference</p>
              <p className="font-mono font-medium text-foreground">{dues.reference}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Invoice Date</p>
              <p className="font-medium text-foreground">{format(dues.createdAt, 'MMM d, yyyy')}</p>
            </div>
          </div>

          <div className="mt-6 border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">Paid to</p>
            <p className="text-sm font-medium text-foreground">NAMSN</p>
            <p className="text-sm text-muted-foreground">funaabnamsn@gmail.com</p>
          </div>

          <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Dues</span>
              <span>{formatNaira(dues.amount)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Processing fee</span>
              <span>{formatNaira(dues.feeAmount)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-base font-semibold text-foreground">
              <span>Amount Due</span>
              <span>{formatNaira(dues.totalAmount)}</span>
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-muted-foreground print:hidden">
            Use the Pay Now button above to settle this invoice online.
          </p>
        </div>
      </div>
    </div>
  );
}
