const STRIPE_API = 'https://api.stripe.com/v1';

function stripeSecret(): string {
  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secret) throw new Error('Stripe is not configured.');
  return secret;
}

export async function createProCheckoutSession(input: {
  userId: string;
  email?: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const priceId = process.env.STRIPE_PRO_PRICE_ID?.trim();
  if (!priceId) throw new Error('STRIPE_PRO_PRICE_ID is not configured.');

  const form = new URLSearchParams({
    mode: 'subscription',
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': '1',
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    client_reference_id: input.userId,
    'metadata[user_id]': input.userId,
    'subscription_data[metadata][user_id]': input.userId,
    'subscription_data[metadata][plan]': 'pro',
    'allow_promotion_codes': 'true'
  });
  if (input.email) form.set('customer_email', input.email);

  const response = await fetch(`${STRIPE_API}/checkout/sessions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeSecret()}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: form,
    signal: AbortSignal.timeout(15_000),
    redirect: 'error'
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.url) {
    throw new Error('Stripe could not create a checkout session.');
  }
  return { id: data.id as string, url: data.url as string };
}

export async function verifyStripeSignature(payload: string, signature: string): Promise<boolean> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret || !signature) return false;
  const values = new Map(signature.split(',').map((part) => {
    const [key, value] = part.trim().split('=', 2);
    return [key, value] as const;
  }));
  const timestamp = Number(values.get('t'));
  const provided = values.get('v1');
  if (!timestamp || !provided || Math.abs(Date.now() / 1000 - timestamp) > 300) return false;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  if (!/^[a-f0-9]{64}$/i.test(provided)) return false;
  const providedBytes = new Uint8Array(provided.match(/.{2}/g)!.map((byte) => parseInt(byte, 16)));
  return crypto.subtle.verify(
    'HMAC',
    key,
    providedBytes,
    new TextEncoder().encode(`${timestamp}.${payload}`)
  );
}
