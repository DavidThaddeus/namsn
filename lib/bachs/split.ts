import { supabaseService } from '@/lib/supabase/serviceClient';

// Bachs Connect isn't available to this account, so the whole charge lands
// in the NAMSN account and the split is tracked in our own payment_splits
// ledger instead, to be paid out manually.
//
// Bachs charges 1.5% on bank transfers, capped at ₦2,000. That fee is taken
// out of the service fee; what's left of it is the developer's share and
// everything else (exactly the dues amount) belongs to the department.
const BACHS_RATE = 0.015;
const BACHS_FEE_CAP = 2000;

export const calculateDeveloperShare = (totalAmount: number, feeAmount: number): number => {
  // Round the Bachs fee up so a rounding difference can never eat into dues.
  const bachsFee = Math.min(Math.ceil(totalAmount * BACHS_RATE * 100) / 100, BACHS_FEE_CAP);
  return Math.max(0, Math.round((feeAmount - bachsFee) * 100) / 100);
};

// Safe to call more than once for the same invoice (webhook + return-page
// confirm can both fire): the unique (dues_request_id, recipient) index
// makes repeat inserts no-ops.
export async function recordPaymentSplits(duesRequestId: string): Promise<void> {
  const { data: dues } = await supabaseService
    .from('dues_requests')
    .select('id, amount, fee_amount, total_amount')
    .eq('id', duesRequestId)
    .single();
  if (!dues) return;

  const developerShare = calculateDeveloperShare(dues.total_amount, dues.fee_amount);

  const { error } = await supabaseService.from('payment_splits').upsert(
    [
      { dues_request_id: dues.id, recipient: 'department', amount: dues.total_amount - dues.fee_amount },
      { dues_request_id: dues.id, recipient: 'developer', amount: developerShare },
    ],
    { onConflict: 'dues_request_id,recipient', ignoreDuplicates: true }
  );
  if (error) console.error('Error recording payment splits:', error);
}
