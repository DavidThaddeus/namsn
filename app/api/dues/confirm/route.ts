import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase/serviceClient';
import { confirmBachsPayment } from '@/lib/bachs/confirmPayment';

// Polled by the dues page right after a student returns from Bachs, and
// again on demand if they hit "Check now". Backs the "Confirming your
// payment..." state with an active check against Bachs itself instead of a
// passive wait for the webhook to land — see confirmBachsPayment for why
// that's the reliable path. No auth required: this only ever reveals
// whether one specific already-known reference is paid, the same trust
// level as the public /verify/<reference> lookup.
export async function POST(req: NextRequest) {
  let reference: unknown;
  try {
    ({ reference } = await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!reference || typeof reference !== 'string') {
    return NextResponse.json({ error: 'reference is required' }, { status: 400 });
  }

  const { data: dues, error } = await supabaseService
    .from('dues_requests')
    .select('id, payment_status, bachs_collection_id')
    .eq('reference', reference.trim().toUpperCase())
    .maybeSingle();

  if (error || !dues) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const paid = await confirmBachsPayment(dues);
    return NextResponse.json({ paid });
  } catch (err) {
    console.error('Error confirming payment with Bachs:', err);
    // Don't fail the poll outright — our own DB stays the fallback truth,
    // and the frontend just tries the direct check again next tick.
    return NextResponse.json({ paid: dues.payment_status === 'paid' });
  }
}
