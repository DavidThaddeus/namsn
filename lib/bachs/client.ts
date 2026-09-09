// Server-only Bachs API client. Never import from a 'use client' component —
// the secret key must never reach the browser.
const BACHS_SECRET_KEY = process.env.BACHS_SECRET_KEY!;
const BACHS_BASE_URL = BACHS_SECRET_KEY.startsWith('sk_live_')
  ? 'https://api.bachs.io'
  : 'https://sandbox-api.bachs.io';

interface BachsErrorBody {
  detail: string;
  error_code: string;
}

async function bachsFetch<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${BACHS_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${BACHS_SECRET_KEY}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...init.headers,
    },
  });

  const body = await res.json();
  if (!res.ok) {
    const err = body as BachsErrorBody;
    throw new Error(`Bachs API error (${err.error_code}): ${err.detail}`);
  }
  return body as T;
}

export interface CreateCheckoutSessionInput {
  customerEmail: string;
  customerName: string;
  amountNaira: number;
  reference: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
  /** When set, routes a fixed share of the sale to this connected account
   * (e.g. the department's Bachs account) and lets the platform absorb the
   * rest after Bachs's own processing fee. */
  destination?: { accountId: string; amountNaira: number };
  idempotencyKey: string;
}

export interface CreateCheckoutSessionResponse {
  checkout_id: string;
  checkout_url: string;
  status: 'open' | 'completed' | 'expired' | 'cancelled';
  expires_at: string;
  created_at: string;
  reference: string | null;
}

// GET /v1/checkout-sessions/{id} does NOT include checkout_url — that's
// only ever returned once, by the create call. Kept as a separate type on
// purpose so this can't silently regress into assuming a field that isn't
// actually there (which is exactly what broke payment: reusing this
// response's nonexistent checkout_url sent the browser to
// `window.location.href = undefined`, landing on /invoice/undefined).
export interface GetCheckoutSessionResponse {
  checkout_id: string;
  status: 'open' | 'completed' | 'expired' | 'cancelled';
  expires_at: string;
  created_at: string;
  reference: string | null;
}

export const getCheckoutSession = (checkoutId: string): Promise<GetCheckoutSessionResponse> => {
  return bachsFetch<GetCheckoutSessionResponse>(`/v1/checkout-sessions/${checkoutId}`, {
    method: 'GET',
  });
};

export const createCheckoutSession = (
  input: CreateCheckoutSessionInput
): Promise<CreateCheckoutSessionResponse> => {
  return bachsFetch<CreateCheckoutSessionResponse>('/v1/checkout-sessions', {
    method: 'POST',
    headers: { 'Idempotency-Key': input.idempotencyKey },
    body: JSON.stringify({
      customer: { email: input.customerEmail, name: input.customerName },
      pricing: {
        currency: 'NGN',
        amount: input.amountNaira.toFixed(2),
        price_type: 'fixed',
      },
      reference: input.reference,
      metadata: input.metadata,
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      // Bank transfer only. Bachs's Local Cards rail is still Beta and
      // costs more (2% vs bank transfer's 1.5%, capped at ₦2,000) — no
      // reason to offer a pricier, less-proven option for a departmental
      // due. Left unrestricted, Bachs also offers US cards and crypto,
      // neither of which fits a Naira-denominated charge at all.
      payment_method_options: { NGN_BANK_TRANSFER: {} },
      ...(input.destination
        ? {
            transfer_data: {
              destination: input.destination.accountId,
              amount: input.destination.amountNaira.toFixed(2),
            },
          }
        : {}),
    }),
  });
};
