import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseService } from '@/lib/supabase/serviceClient';
import { createCheckoutSession } from '@/lib/bachs/client';

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

  try {
    const session = await createCheckoutSession({
      customerEmail: dues.email,
      customerName: dues.full_name,
      amountNaira: dues.total_amount,
      reference: dues.reference,
      successUrl: `${origin}/dashboard/dues?paid=1&reference=${dues.reference}`,
      cancelUrl: `${origin}/dashboard/dues?cancelled=1`,
      metadata: { dues_request_id: dues.id },
      idempotencyKey: dues.reference,
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
    return NextResponse.json({ error: 'Failed to start payment' }, { status: 500 });
  }
}
