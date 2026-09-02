import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createProCheckoutSession } from '@/lib/billing/stripe';
import { readJsonBody, requestLimitResponse } from '@/lib/security/request';
import { checkoutRequestSchema, type CheckoutRequest } from '@/lib/security/schemas';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 });

    const body = checkoutRequestSchema.parse(await readJsonBody<CheckoutRequest>(request, 8 * 1024));
    const locale = body.locale || 'vi';
    const origin = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
    const session = await createProCheckoutSession({
      userId: data.user.id,
      email: data.user.email,
      successUrl: `${origin}/${locale}/account?billing=success`,
      cancelUrl: `${origin}/${locale}/pricing?billing=cancelled`
    });
    return NextResponse.json(session);
  } catch (error) {
    const limited = requestLimitResponse(error);
    if (limited) return limited;
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Unsupported plan or locale.' }, { status: 400 });
    }
    console.error('[BillingCheckout]', error);
    return NextResponse.json({ error: 'Checkout is not configured or is temporarily unavailable.' }, { status: 503 });
  }
}
