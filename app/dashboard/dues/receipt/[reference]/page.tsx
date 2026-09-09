'use client';

import { use, useEffect, useState } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import QRCode from 'qrcode';
import { Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { findDuesRequests } from '@/lib/supabase/duesService';
import { DuesRequest } from '@/types/dues';

const formatNaira = (amount: number) => `₦${amount.toLocaleString('en-NG')}`;

export default function ReceiptPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = use(params);
  const [dues, setDues] = useState<DuesRequest | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    findDuesRequests({ reference })
      .then((data) => {
        if (cancelled) return;
        const record = data[0] || null;
        setDues(record);
        if (record) {
          const verifyUrl = `${window.location.origin}/verify/${record.reference}`;
          QRCode.toDataURL(verifyUrl, { width: 160, margin: 1 })
            .then((url) => !cancelled && setQrDataUrl(url))
            .catch((err) => console.error('Error generating QR code:', err));
        }
      })
      .catch((err) => {
        console.error('Error loading receipt:', err);
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Failed to load receipt.');
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [reference]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <p className="text-lg font-medium text-destructive">Couldn&apos;t load this receipt</p>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">{loadError}</p>
      </div>
    );
  }

  if (!dues || dues.paymentStatus !== 'paid') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <p className="text-lg font-medium text-foreground">Receipt not available</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {dues ? 'This dues request has not been paid yet.' : 'No record found for that reference.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="font-display text-2xl font-bold text-foreground">Receipt</h1>
        <Button onClick={() => window.print()} className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Printer className="h-4 w-4" /> Print / Save as PDF
        </Button>
      </div>

      <div className="relative mx-auto max-w-2xl overflow-hidden rounded-2xl border border-border bg-card p-10 shadow-sm print:rounded-none print:border-0 print:shadow-none">
        {/* Watermark */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
        >
          <span className="rotate-[-30deg] whitespace-nowrap text-6xl font-bold uppercase tracking-widest text-success/[0.08] print:text-success/15">
            NAMSN FUNAAB · PAID
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
            {qrDataUrl && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={qrDataUrl} alt="Verification QR code" width={100} height={100} />
            )}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-foreground">Payment Receipt</h2>
            <span className="bg-success px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
              Paid
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
              <p className="text-muted-foreground">Date Paid</p>
              <p className="font-medium text-foreground">
                {dues.paidAt ? format(dues.paidAt, 'MMM d, yyyy') : '—'}
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
            <div>
              <p className="text-xs text-muted-foreground">Paid to</p>
              <p className="text-sm font-medium text-foreground">NAMSN</p>
              <p className="text-sm text-muted-foreground">funaabnamsn@gmail.com</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Amount Paid</p>
              <p className="text-lg font-semibold text-foreground">{formatNaira(dues.amount)}</p>
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Scan the QR code above to verify this receipt online.
          </p>
        </div>
      </div>
    </div>
  );
}
