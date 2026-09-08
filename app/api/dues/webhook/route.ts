import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase/serviceClient';
import { verifyBachsSignature } from '@/lib/bachs/verifySignature';

const WEBHOOK_SECRET = process.env.BACHS_WEBHOOK_SECRET!;

interface BachsWebhookEvent {
  id: string;
  type: string;
  created_at: string;
  organization_id: string;
  data: {
    reference?: string | null;
    checkout_id?: string;
    payment_id?: string;
    status?: string;
    amount?: string;
    currency?: string;
    metadata?: Record<string, string>;
    [key: string]: unknown;
  };
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-bachs-signature');
  const timestamp = req.headers.get('x-bachs-timestamp');

  if (!verifyBachsSignature(rawBody, timestamp, signature, WEBHOOK_SECRET)) {
    console.error('Bachs webhook: signature verification failed');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(rawBody) as BachsWebhookEvent;

  // At-least-once delivery means the same event can arrive more than once —
  // check we haven't already recorded this exact event id before acting.
  const { data: existing } = await supabaseService
    .from('payment_events')
    .select('id')
    .eq('bachs_event_id', event.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  // Match by our own dues_request id (sent as checkout metadata) first —
  // it's our real primary key and never changes. The Bachs checkout
  // `reference` is a fresh, per-attempt value (see checkout/route.ts), so
  // it's only useful as a fallback, not the primary lookup.
  const duesId = event.data.metadata?.dues_request_id;
  const reference = event.data.reference;

  let duesRequestId: string | null = null;
  {
    const query = supabaseService.from('dues_requests').select('id, payment_status');
    const { data: dues } = duesId
      ? await query.eq('id', duesId).maybeSingle()
      : reference
        ? await query.eq('reference', reference).maybeSingle()
        : { data: null };

    if (dues) {
      duesRequestId = dues.id;

      if (event.type === 'collection.succeeded' && dues.payment_status !== 'paid') {
        await supabaseService
          .from('dues_requests')
          .update({
            payment_status: 'paid',
            paid_at: new Date().toISOString(),
            bachs_collection_id: event.data.checkout_id || null,
          })
          .eq('id', dues.id);
      }
    }
  }

  await supabaseService.from('payment_events').insert({
    dues_request_id: duesRequestId,
    bachs_event_id: event.id,
    event_type: event.type,
    bachs_collection_id: event.data.checkout_id || null,
    payload: event,
  });

  return NextResponse.json({ received: true });
}
