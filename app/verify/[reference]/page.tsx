import Image from 'next/image';
import { CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { verifyReceipt } from '@/lib/supabase/duesService';

export const dynamic = 'force-dynamic';

const formatNaira = (amount: number) => `₦${amount.toLocaleString('en-NG')}`;

export default async function VerifyReceiptPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  const receipt = await verifyReceipt(reference);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center">
          <Image src="/namsn.png" alt="NAMSN" width={56} height={56} />
        </div>

        {receipt ? (
          <>
            <CheckCircle2 className="mx-auto mt-4 h-12 w-12 text-primary" />
            <h1 className="font-display mt-3 text-xl font-bold text-foreground">Receipt Verified</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              This is a genuine departmental dues payment record.
            </p>

            <div className="mt-6 space-y-2 rounded-lg border border-border bg-background p-5 text-left text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium text-foreground">{receipt.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium text-foreground">{receipt.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Level</span>
                <span className="font-medium text-foreground">{receipt.level}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reference</span>
                <span className="font-mono font-medium text-foreground">{receipt.reference}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="text-muted-foreground">Amount Paid</span>
                <span className="font-semibold text-foreground">{formatNaira(receipt.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Paid On</span>
                <span className="font-medium text-foreground">{format(receipt.paidAt, 'MMM d, yyyy')}</span>
              </div>
            </div>

            <p className="mt-5 text-xs text-muted-foreground">
              NAMSN FUNAAB — National Association of Mathematics Students, Department of Mathematics
            </p>
          </>
        ) : (
          <>
            <XCircle className="mx-auto mt-4 h-12 w-12 text-destructive" />
            <h1 className="font-display mt-3 text-xl font-bold text-foreground">Not Verified</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We couldn&apos;t verify a paid receipt for this reference. It may be incorrect, or the
              payment hasn&apos;t been confirmed yet.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
