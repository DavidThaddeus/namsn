import { supabaseService } from '@/lib/supabase/serviceClient';
import { getCheckoutSession } from './client';

interface DuesRowForConfirm {
  id: string;
  payment_status: string;
  bachs_collection_id: string | null;
}

// Single source of truth for "is this invoice actually paid" that doesn't
// just trust our own database — it asks Bachs directly whenever our record
// still says pending. This is what makes payment confirmation resilient to
// a webhook that's slow, dropped, or misconfigured on Bachs's side: as long
// as a checkout session was ever created for this invoice, this can always
// re-derive the true status straight from Bachs and self-heal our row to
// match, without needing an admin to step in and mark it paid by hand.
//
// Used both as the checkout route's existing "don't double-charge" guard
// and as the return-page poll's active check — one implementation, so the
// two can't quietly drift apart.
export async function confirmBachsPayment(dues: DuesRowForConfirm): Promise<boolean> {
  if (dues.payment_status === 'paid') return true;
  if (!dues.bachs_collection_id) return false;

  const session = await getCheckoutSession(dues.bachs_collection_id);
  if (session.status !== 'completed') return false;

  await supabaseService
    .from('dues_requests')
    .update({ payment_status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', dues.id);

  return true;
}
