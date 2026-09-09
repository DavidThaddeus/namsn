import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseService } from '@/lib/supabase/serviceClient';
import { createCheckoutSession, getCheckoutSession } from '@/lib/bachs/client';

const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const accessToken = authHeader?.replace('Bearer ', '');
  if (!accessToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { data: userData, error: authError } = await supabaseAuth.auth.getUser(accessToken);
  if (authError || !userData.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { duesRequestId } = await req.json();
  if (!duesRequestId) {
    return NextResponse.json({ error: 'duesRequestId is required' }, { status: 400 });
  }

  const { data: dues, error: fetchError } = await supabaseService
    .from('dues_requests')
    .select('*')
    .eq('id', duesRequestId)
    .single();

  if (fetchError || !dues) {
    return NextResponse.json({ error: 'Dues request not found' }, { status: 404 });
  }

  // A student may only pay their own invoice — the service-role client
  // bypasses RLS, so this ownership check has to happen here instead.
  if (dues.created_by !== userData.user.id) {
    return NextResponse.json({ error: 'Not authorized for this dues request' }, { status: 403 });
  }

  if (dues.payment_status === 'paid') {
    return NextResponse.json({ error: 'This dues request is already paid' }, { status: 409 });
  }

  // Bachs rejects localhost for success/cancel URLs, so SITE_URL (a real
  // domain) takes priority; falls back to the request's own origin once
  // actually deployed somewhere public.
  const origin = process.env.SITE_URL || req.nextUrl.origin;

  // Guard against paying the same invoice twice. Our own payment_status
  // check above only catches this once the webhook has landed — if a
  // student clicks Pay Now again in the gap between actually paying and
  // the webhook confirming it, that check alone would miss it and a new
  // checkout would be created. So check the previous session directly: if
  // it's already completed, this invoice is paid, full stop (and we
  // self-heal our own record here rather than waiting on the webhook,
  // since we've just confirmed it directly with Bachs). If it's still
  // open (or anything else), fall through to start a fresh one — Bachs'
  // GET endpoint doesn't return the hosted checkout_url, only the create
  // call does, so the old link genuinely can't be reused here.
  if (dues.bachs_collection_id) {
    try {
      const existing = await getCheckoutSession(dues.bachs_collection_id);
      if (existing.status === 'completed') {
        if (dues.payment_status !== 'paid') {
          await supabaseService
            .from('dues_requests')
            .update({ payment_status: 'paid', paid_at: new Date().toISOString() })
            .eq('id', dues.id);
        }
        return NextResponse.json({ error: 'This dues request is already paid' }, { status: 409 });
      }
    } catch (error) {
      console.error('Error checking existing checkout session:', error);
      // Fall through and create a new one if we can't confirm the old one's state.
    }
  }

  try {
    // Bachs requires a checkout session's `reference` to be unique per
    // attempt, not per invoice — dues.reference stays the same for the
    // life of the invoice (shown on receipts, used for search), so a retry
    // needs its own fresh value here instead of reusing it directly.
    const attemptReference = `${dues.reference}-${Date.now().toString(36).toUpperCase()}`;

    const session = await createCheckoutSession({
      customerEmail: dues.email,
      customerName: dues.full_name,
      amountNaira: dues.total_amount,
      reference: attemptReference,
      successUrl: `${origin}/dashboard/dues?paid=1&reference=${dues.reference}`,
      cancelUrl: `${origin}/dashboard/dues?cancelled=1`,
      metadata: { dues_request_id: dues.id },
      // A fresh key per attempt, not dues.reference — that never changes for
      // this invoice, so reusing it as the idempotency key meant any retry
      // after the first checkout session expired (60 min) got rejected as a
      // conflict instead of just starting a new one.
      idempotencyKey: crypto.randomUUID(),
      // Destination split (department account) is added once the connected
      // account exists — see Phase 4 step 15. Full amount goes to the
      // platform account for now.
    });

    await supabaseService
      .from('dues_requests')
      .update({ bachs_collection_id: session.checkout_id })
      .eq('id', dues.id);

    return NextResponse.json({ checkoutUrl: session.checkout_url });
  } catch (error) {
    console.error('Error creating Bachs checkout session:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to start payment: ${message}` }, { status: 500 });
  }
}
