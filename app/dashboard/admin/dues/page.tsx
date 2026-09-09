'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { CheckCircle2, Circle, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { searchDuesRequests, getAllDuesRequests } from '@/lib/supabase/duesService';
import { DuesRequest } from '@/types/dues';

const formatNaira = (amount: number) => `₦${amount.toLocaleString('en-NG')}`;

export default function AdminDuesPage() {
  const [requests, setRequests] = useState<DuesRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);

  const loadAll = () => {
    setLoading(true);
    getAllDuesRequests()
      .then(setRequests)
      .catch((err) => {
        console.error('Error loading dues requests:', err);
        toast.error('Failed to load dues requests');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      loadAll();
      return;
    }
    setSearching(true);
    try {
      const data = await searchDuesRequests(searchQuery);
      setRequests(data);
    } catch (error) {
      console.error('Error searching dues requests:', error);
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    loadAll();
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-5">
        <h1 className="font-display text-2xl font-bold text-foreground">Dues Records</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Search any student&apos;s payment request by matric number or reference, and view their
          invoice or receipt. Payment status is confirmed automatically by Bachs and can&apos;t be
          changed manually here.
        </p>
      </div>

      <form onSubmit={handleSearch} className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by matric number or reference (NAMSN-XXXXXXXX)"
            className="pl-10"
          />
        </div>
        <div className="mt-3 flex gap-2">
          <Button type="submit" disabled={searching} className="bg-accent text-accent-foreground hover:bg-accent/90">
            {searching && <Loader2 className="h-4 w-4 animate-spin" />}
            Search
          </Button>
          <Button type="button" variant="outline" onClick={clearSearch}>
            Show All
          </Button>
        </div>
      </form>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : requests.length === 0 ? (
          <div className="px-6 py-12 text-center text-muted-foreground">No dues records found.</div>
        ) : (
          <ul className="divide-y divide-border">
            {requests.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{r.fullName}</p>
                    <Badge variant="secondary">{r.status}</Badge>
                    <Badge variant="outline" className="font-mono">{r.reference}</Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span>Matric: {r.matricNumber}</span>
                    <span>Level: {r.level}</span>
                    <span>Dues: {formatNaira(r.amount)} + Fee: {formatNaira(r.feeAmount)} = {formatNaira(r.totalAmount)}</span>
                    <span className="break-words">{r.email}</span>
                    <span className="break-words">{r.phone}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Submitted {format(r.createdAt, 'MMM d, yyyy')}</p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
                  {r.paymentStatus === 'paid' ? (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/dues/receipt/${r.reference}`}>Receipt</Link>
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/dues/invoice/${r.reference}`}>Invoice</Link>
                    </Button>
                  )}
                  <span
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium ${
                      r.paymentStatus === 'paid' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {r.paymentStatus === 'paid' ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <Circle className="h-3.5 w-3.5" />
                    )}
                    {r.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
