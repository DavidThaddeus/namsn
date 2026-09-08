'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { CheckCircle2, Copy, Loader2, Receipt, Search, Wallet, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/config';
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
import {
  submitDuesRequest,
  findDuesRequests,
  searchDuesRequests,
  getMyUnpaidDuesRequests,
} from '@/lib/supabase/duesService';
import { DuesLevel, DuesRequest, StudentStatus } from '@/types/dues';
import { format } from 'date-fns';

const LEVEL_INFO: Record<DuesLevel, { status: StudentStatus; amount: number }> = {
  '100': { status: 'FRESHERS', amount: 6000 },
  '200': { status: 'STAYLITES', amount: 4000 },
  '300': { status: 'STAYLITES', amount: 4000 },
  '400': { status: 'STAYLITES', amount: 4000 },
};

// Flat processing fee added on top of dues at the actual payment step.
const SERVICE_FEE = 150;

// How long to keep auto-checking for the webhook to confirm a payment
// before giving up and telling the student to check back later.
const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 120000;

// Cap on how many unpaid invoices one student can have open at once — high
// enough that someone unsure whether a first attempt "worked" isn't stuck,
// but low enough to stop invoice creation from being used as a way to avoid
// dealing with an existing one.
const MAX_UNPAID_INVOICES = 3;

const formatNaira = (amount: number) => `₦${amount.toLocaleString('en-NG')}`;

function DuesPageContent() {
  const { currentUser } = useAuth();
  const searchParams = useSearchParams();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    matricNumber: '',
    level: '100' as DuesLevel,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState<DuesRequest | null>(null);
  const [payingNow, setPayingNow] = useState(false);
  const [unpaidInvoices, setUnpaidInvoices] = useState<DuesRequest[] | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState<DuesRequest[]>([]);

  const [paymentReturn, setPaymentReturn] = useState<'paid' | 'cancelled' | null>(null);
  const [paymentReturnRequest, setPaymentReturnRequest] = useState<DuesRequest | null>(null);
  const [pollTimedOut, setPollTimedOut] = useState(false);
  const pollStartedAt = useRef<number | null>(null);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { status, amount } = LEVEL_INFO[form.level];

  useEffect(() => {
    const paid = searchParams.get('paid');
    const cancelled = searchParams.get('cancelled');
    const reference = searchParams.get('reference');

    if (paid === '1' && reference) {
      setPaymentReturn('paid');
      pollStartedAt.current = Date.now();

      const poll = () => {
        findDuesRequests({ reference })
          .then((data) => {
            const record = data[0] || null;
            setPaymentReturnRequest(record);
            if (record?.paymentStatus === 'paid') return; // stop polling

            const elapsed = Date.now() - (pollStartedAt.current || Date.now());
            if (elapsed >= POLL_TIMEOUT_MS) {
              setPollTimedOut(true);
              return;
            }
            pollTimer.current = setTimeout(poll, POLL_INTERVAL_MS);
          })
          .catch((err) => console.error('Error checking payment status:', err));
      };
      poll();
    } else if (cancelled === '1') {
      setPaymentReturn('cancelled');
    }

    return () => {
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!form.fullName || !form.email || !form.phone || !form.matricNumber) {
      toast.error('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      const unpaid = await getMyUnpaidDuesRequests(currentUser.uid);
      if (unpaid.length >= MAX_UNPAID_INVOICES) {
        setUnpaidInvoices(unpaid);
        return;
      }

      const created = await submitDuesRequest(
        { ...form, status, amount, feeAmount: SERVICE_FEE },
        currentUser.uid
      );
      setSubmittedRequest(created);
      toast.success('Request received!');
    } catch (error) {
      console.error('Error submitting dues request:', error);
      toast.error('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyReference = () => {
    if (!submittedRequest) return;
    navigator.clipboard.writeText(submittedRequest.reference);
    toast.success('Reference copied');
  };

  const handlePayNow = async () => {
    if (!submittedRequest) return;
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
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ duesRequestId: submittedRequest.id }),
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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setSearched(false);
    try {
      const data = await searchDuesRequests(searchQuery);
      setResults(data);
      setSearched(true);
    } catch (error) {
      console.error('Error searching dues requests:', error);
      toast.error('Search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-5">
        <h1 className="font-display text-2xl font-bold text-foreground">Dues</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Pay your departmental dues and find your payment records.
        </p>
      </div>

      {paymentReturn === 'paid' && (
        <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-5">
          {paymentReturnRequest?.paymentStatus === 'paid' ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
          ) : (
            <Loader2 className="mt-0.5 h-5 w-5 flex-shrink-0 animate-spin text-primary" />
          )}
          <div>
            <p className="font-medium text-foreground">
              {paymentReturnRequest?.paymentStatus === 'paid'
                ? 'Payment successful!'
                : pollTimedOut
                  ? 'Still confirming...'
                  : 'Confirming your payment...'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {paymentReturnRequest?.paymentStatus === 'paid'
                ? `Thank you — your ${paymentReturnRequest.status.toLowerCase()} dues (${formatNaira(paymentReturnRequest.amount)}) have been received.`
                : pollTimedOut
                  ? "This is taking longer than usual. Your payment may still be processing on Bachs' side — search your reference below in a bit, or contact the department if this doesn't clear up."
                  : "Your payment went through on Bachs' side — we're just waiting for confirmation to land in our records. This page will update automatically, no need to refresh."}
            </p>
            {paymentReturnRequest?.paymentStatus === 'paid' && (
              <Link
                href={`/dashboard/dues/receipt/${paymentReturnRequest.reference}`}
                className="mt-3 inline-flex items-center gap-1.5 bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90"
              >
                <Receipt className="h-4 w-4" /> Download Receipt
              </Link>
            )}
          </div>
        </div>
      )}

      {paymentReturn === 'cancelled' && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-5">
          <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />
          <div>
            <p className="font-medium text-foreground">Payment cancelled</p>
            <p className="mt-1 text-sm text-muted-foreground">
              No charge was made. You can search your reference below or submit a new request to try again.
            </p>
          </div>
        </div>
      )}

      {/* Find receipt / invoice — at the top, this is what most returning visitors want */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center bg-secondary text-secondary-foreground">
            <Receipt className="h-5 w-5" />
          </div>
          <h2 className="font-display text-lg font-semibold text-foreground">
            Find Your Receipt, Invoice, or Dues Status
          </h2>
        </div>

        <form onSubmit={handleSearch} className="mt-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Matric number or reference (NAMSN-XXXXXXXX)"
              className="pl-10"
            />
          </div>
          <Button type="submit" variant="outline" disabled={searching} className="sm:w-fit">
            {searching && <Loader2 className="h-4 w-4 animate-spin" />}
            Search
          </Button>
        </form>

        {searched && (
          <div className="mt-5">
            {results.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No record found. Once you submit a payment request below, it will show up here.
              </p>
            ) : (
              <div className="space-y-3">
                {results.map((r) => (
                  <div key={r.id} className="rounded-lg border border-border bg-muted/40 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">{r.fullName}</p>
                      <Badge variant="secondary">{r.status}</Badge>
                    </div>
                    <div className="mt-2 grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
                      <span className="font-mono">Ref: {r.reference}</span>
                      <span>Matric: {r.matricNumber}</span>
                      <span>Level: {r.level}</span>
                      <span>Amount to pay: {formatNaira(r.totalAmount)}</span>
                      <span className="capitalize">Payment status: {r.paymentStatus}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        Submitted {format(r.createdAt, 'MMM d, yyyy')}
                      </p>
                      {r.paymentStatus === 'paid' ? (
                        <Link
                          href={`/dashboard/dues/receipt/${r.reference}`}
                          className="text-xs font-medium text-primary underline underline-offset-2"
                        >
                          View Receipt
                        </Link>
                      ) : (
                        <Link
                          href={`/dashboard/dues/invoice/${r.reference}`}
                          className="text-xs font-medium text-primary underline underline-offset-2"
                        >
                          View Invoice
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pay Dues */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center bg-primary text-primary-foreground">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">Pay Departmental Dues</h2>
            <p className="text-sm text-muted-foreground">₦6,000 for FRESHERS (100L) · ₦4,000 for STAYLITES (200–400L)</p>
          </div>
        </div>

        {unpaidInvoices ? (
          <div className="mt-6 space-y-4 rounded-lg border border-accent/30 bg-accent/5 p-6">
            <div>
              <p className="font-medium text-foreground">You already have {unpaidInvoices.length} unpaid invoices</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Pay or check one of these instead of starting a new one — starting a new invoice doesn&apos;t
                make an existing one pay faster.
              </p>
            </div>
            <div className="space-y-2">
              {unpaidInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-background p-3 text-sm"
                >
                  <span className="font-mono">{inv.reference}</span>
                  <span className="text-muted-foreground">{formatNaira(inv.totalAmount)}</span>
                  <Link
                    href={`/dashboard/dues/invoice/${inv.reference}`}
                    className="font-medium text-primary underline underline-offset-2"
                  >
                    View &amp; Pay
                  </Link>
                </div>
              ))}
            </div>
            <Button variant="outline" onClick={() => setUnpaidInvoices(null)}>
              Back
            </Button>
          </div>
        ) : submittedRequest ? (
          <div className="mt-6 flex flex-col items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-primary" />
            <div>
              <p className="font-medium text-foreground">Request received</p>
              <p className="mt-1 text-sm text-muted-foreground">
                We&apos;ve recorded your details under {submittedRequest.status} status.
              </p>
            </div>
            <div className="w-full max-w-xs rounded-lg border border-border bg-background p-4 text-left text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Dues</span>
                <span>{formatNaira(submittedRequest.amount)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Processing fee</span>
                <span>{formatNaira(submittedRequest.feeAmount)}</span>
              </div>
              <div className="mt-2 flex justify-between border-t border-border pt-2 font-semibold text-foreground">
                <span>Amount to pay</span>
                <span>{formatNaira(submittedRequest.totalAmount)}</span>
              </div>
            </div>
            <Button
              onClick={handlePayNow}
              disabled={payingNow}
              className="w-full max-w-xs bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {payingNow && <Loader2 className="h-4 w-4 animate-spin" />}
              Pay {formatNaira(submittedRequest.totalAmount)} Now
            </Button>
            <Link
              href={`/dashboard/dues/invoice/${submittedRequest.reference}`}
              className="text-sm font-medium text-primary underline underline-offset-2"
            >
              View Printable Invoice
            </Link>
            <button
              type="button"
              onClick={handleCopyReference}
              className="flex items-center gap-2 rounded-lg border border-dashed border-primary/40 bg-background px-4 py-2.5"
              title="Click to copy"
            >
              <span className="text-xs text-muted-foreground">Your reference:</span>
              <span className="font-mono text-sm font-semibold text-foreground">{submittedRequest.reference}</span>
              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <p className="text-xs text-muted-foreground">
              Save this reference — use it above (or your matric number) to find this request later.
            </p>
            <Button variant="outline" onClick={() => setSubmittedRequest(null)}>
              Submit another request
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={form.fullName}
                  onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                  placeholder="Your full name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="your.email@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="+234..."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="matricNumber">Matric Number</Label>
                <Input
                  id="matricNumber"
                  value={form.matricNumber}
                  onChange={(e) => setForm((p) => ({ ...p, matricNumber: e.target.value }))}
                  placeholder="e.g. 20101234"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="level">Level</Label>
                <Select
                  value={form.level}
                  onValueChange={(value) => setForm((p) => ({ ...p, level: value as DuesLevel }))}
                >
                  <SelectTrigger id="level" className="w-full">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100">100 Level</SelectItem>
                    <SelectItem value="200">200 Level</SelectItem>
                    <SelectItem value="300">300 Level</SelectItem>
                    <SelectItem value="400">400 Level</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status &amp; Amount</Label>
                <div className="flex h-9 items-center gap-2 rounded-md border border-input bg-muted px-3 text-sm">
                  <Badge variant="secondary">{status}</Badge>
                  <span className="font-medium text-foreground">{formatNaira(amount)}</span>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90 sm:w-auto"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? 'Submitting...' : `Submit Payment Request — ${formatNaira(amount)}`}
            </Button>
            <p className="text-xs text-muted-foreground">
              Submitting creates your invoice — you&apos;ll be able to pay online right away.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

export default function DuesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <DuesPageContent />
    </Suspense>
  );
}
