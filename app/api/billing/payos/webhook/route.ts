import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyPayOSWebhook } from '@/lib/billing/payos';
import { payosWebhookSchema } from '@/lib/security/schemas';
import { readJsonBody, requestLimitResponse } from '@/lib/security/request';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const raw = await readJsonBody<Record<string, unknown>>(request, 64 * 1024);
    const payload = payosWebhookSchema.parse(raw);
    const verification = await verifyPayOSWebhook(payload.data, payload.signature);
    if (!verification.valid) {
      console.error('[PayOSWebhook] Signature mismatch:', {
        receivedSignature: payload.signature,
        computedSignature: verification.computedSignature,
        keyOnVercel: verification.keyPreview
      });
      return NextResponse.json({ error: 'Invalid payOS webhook signature.' }, { status: 400 });
    }
    const isFailed = payload.success === false
      || (payload.code !== undefined && String(payload.code) !== '00')
      || (payload.data.code !== undefined && String(payload.data.code) !== '00');
    if (isFailed) {
      return NextResponse.json({ received: true, ignored: true });
    }
    const orderCode = Number(payload.data.orderCode);
    const amount = Number(payload.data.amount);
    if (!Number.isSafeInteger(orderCode) || !Number.isSafeInteger(amount)) {
      return NextResponse.json({ error: 'Invalid payOS transaction data.' }, { status: 400 });
    }
    const admin = createAdminClient();
    const { data: order, error: orderError } = await admin.from('numina_payment_orders')
      .select('amount,currency')
      .eq('provider', 'payos')
      .eq('order_code', orderCode)
      .maybeSingle();
    // payOS sends a signed sample while confirming a webhook URL.
    if (orderError || !order) return NextResponse.json({ received: true, ignored: true });
    if (order.amount !== amount || String(order.currency).toLowerCase() !== 'vnd') {
      return NextResponse.json({ error: 'Payment amount does not match the order.' }, { status: 400 });
    }
    const transactionId = String(payload.data.reference || payload.data.paymentLinkId || `${orderCode}`);
    const eventId = `payos:${transactionId}`;
    const paidAtRaw = String(payload.data.transactionDateTime || '');
    const paidAt = Number.isFinite(new Date(paidAtRaw).getTime()) ? new Date(paidAtRaw).toISOString() : new Date().toISOString();
    const { data, error } = await admin.rpc('apply_numina_payos_payment', {
      p_order_code: orderCode,
      p_event_id: eventId,
      p_transaction_id: transactionId,
      p_paid_at: paidAt
    });
    if (error) throw error;
    return NextResponse.json({ received: true, result: data });
  } catch (error) {
    const limited = requestLimitResponse(error);
    if (limited) return limited;
    console.error('[PayOSWebhook]', error);
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid payOS webhook payload.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'payOS webhook processing failed.' }, { status: 500 });
  }
}
