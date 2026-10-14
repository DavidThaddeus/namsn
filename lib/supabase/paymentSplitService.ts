import { supabase } from './config';

export type SplitRecipient = 'department' | 'developer';
export type SplitStatus = 'pending' | 'sent' | 'failed';

export interface PaymentSplit {
  id: string;
  duesRequestId: string;
  recipient: SplitRecipient;
  amount: number;
  status: SplitStatus;
  fullName: string;
  reference: string;
  createdAt: Date;
}

interface SplitRow {
  id: string;
  dues_request_id: string;
  recipient: SplitRecipient;
  amount: number | string;
  status: SplitStatus;
  created_at: string;
  dues_requests: { full_name: string; reference: string } | null;
}

export async function getPaymentSplits(): Promise<PaymentSplit[]> {
  const { data, error } = await supabase
    .from('payment_splits')
    .select('*, dues_requests(full_name, reference)')
    .order('created_at', { ascending: false });
  if (error) throw error;

  return (data as SplitRow[]).map((row) => ({
    id: row.id,
    duesRequestId: row.dues_request_id,
    recipient: row.recipient,
    // numeric columns come back as strings from PostgREST
    amount: Number(row.amount),
    status: row.status,
    fullName: row.dues_requests?.full_name ?? 'Unknown',
    reference: row.dues_requests?.reference ?? '',
    createdAt: new Date(row.created_at),
  }));
}

export async function setSplitsStatus(ids: string[], status: SplitStatus): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await supabase.from('payment_splits').update({ status }).in('id', ids);
  if (error) throw error;
}
