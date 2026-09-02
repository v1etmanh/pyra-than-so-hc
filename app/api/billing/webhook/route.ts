import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyStripeSignature } from '@/lib/billing/stripe';
import { readTextBody, requestLimitResponse } from '@/lib/security/request';
import { stripeWebhookEventSchema } from '@/lib/security/schemas';

export const dynamic = 'force-dynamic';

async function withDatabaseRetry(operation: () => PromiseLike<{ error: { message: string } | null }>, attempts = 3): Promise<void> {
  let lastError = 'Unknown database error';
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const result = await operation();
      if (!result.error) return;
      lastError = result.error.message;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    if (attempt < attempts) {
      await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
    }
  }
  throw new Error(lastError);
}

export async function POST(request: NextRequest) {
  let payload: string;
  try {
    payload = await readTextBody(request, 256 * 1024);
  } catch (error) {
    const limited = requestLimitResponse(error);
    if (limited) return limited;
    return NextResponse.json({ error: 'Invalid webhook payload.' }, { status: 400 });
  }
  const signature = request.headers.get('stripe-signature') || '';
  if (!(await verifyStripeSignature(payload, signature))) {
    return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 400 });
  }

  try {
    const event = stripeWebhookEventSchema.parse(JSON.parse(payload)) as {
      type: string;
      data?: { object?: Record<string, unknown> };
    };
    const object = event.data?.object || {};
    const admin = createAdminClient();

    if (event.type === 'checkout.session.completed') {
      const userId = String(object.client_reference_id || (object.metadata as Record<string, unknown> | undefined)?.user_id || '');
      if (userId) {
        await withDatabaseRetry(() => admin.from('numina_subscriptions').upsert({
          user_id: userId,
          plan: 'pro',
          status: 'active',
          stripe_customer_id: object.customer || null,
          stripe_subscription_id: object.subscription || null,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' }));
      }
    }

    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const metadata = (object.metadata || {}) as Record<string, unknown>;
      const userId = String(metadata.user_id || '');
      const status = event.type.endsWith('deleted') ? 'canceled' : String(object.status || 'active');
      if (userId) {
        await withDatabaseRetry(() => admin.from('numina_subscriptions').upsert({
          user_id: userId,
          plan: status === 'active' || status === 'trialing' ? 'pro' : 'free',
          status,
          stripe_customer_id: object.customer || null,
          stripe_subscription_id: object.id || null,
          current_period_end: object.current_period_end ? new Date(Number(object.current_period_end) * 1000).toISOString() : null,
          cancel_at_period_end: Boolean(object.cancel_at_period_end),
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' }));
      }
    }

    if (event.type === 'invoice.paid') {
      const metadata = (object.metadata || {}) as Record<string, unknown>;
      const userId = String(metadata.user_id || '');
      if (userId) {
        await withDatabaseRetry(() => admin.from('numina_payment_events').upsert({
          user_id: userId,
          stripe_event_id: String(object.id || ''),
          amount: Number(object.amount_paid || 0),
          currency: String(object.currency || 'usd'),
          status: 'paid',
          description: 'Numina Pro subscription',
          created_at: new Date().toISOString()
        }, { onConflict: 'stripe_event_id' }));
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[BillingWebhook]', error);
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid webhook payload.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 });
  }
}
