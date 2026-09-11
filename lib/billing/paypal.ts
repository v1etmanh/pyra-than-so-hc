const PAYPAL_SANDBOX_API = 'https://api-m.sandbox.paypal.com';
const PAYPAL_LIVE_API = 'https://api-m.paypal.com';

type JsonRecord = Record<string, unknown>;

function paypalApiBase(): string {
  return process.env.PAYPAL_ENV === 'live' ? PAYPAL_LIVE_API : PAYPAL_SANDBOX_API;
}

function paypalCredentials(): { clientId: string; secret: string } {
  const clientId = process.env.PAYPAL_CLIENT_ID?.trim();
  const secret = process.env.PAYPAL_CLIENT_SECRET?.trim();
  if (!clientId || !secret) throw new Error('PayPal is not configured.');
  return { clientId, secret };
}

export function paypalPlanId(): string {
  const planId = process.env.PAYPAL_PRO_PLAN_ID?.trim();
  if (!planId) throw new Error('PAYPAL_PRO_PLAN_ID is not configured.');
  return planId;
}

async function paypalAccessToken(): Promise<string> {
  const { clientId, secret } = paypalCredentials();
  const response = await fetch(`${paypalApiBase()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials',
    signal: AbortSignal.timeout(15_000)
  });
  const data = await response.json().catch(() => ({})) as JsonRecord;
  if (!response.ok || typeof data.access_token !== 'string') {
    throw new Error('PayPal authentication failed.');
  }
  return data.access_token;
}

async function paypalRequest(path: string, init: RequestInit = {}): Promise<JsonRecord> {
  const token = await paypalAccessToken();
  const response = await fetch(`${paypalApiBase()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers || {})
    },
    signal: AbortSignal.timeout(15_000)
  });
  const data = await response.json().catch(() => ({})) as JsonRecord;
  if (!response.ok) {
    const message = typeof data.message === 'string' ? data.message : 'PayPal request failed.';
    throw new Error(message);
  }
  return data;
}

export async function createPayPalSubscription(input: {
  userId: string;
  locale: 'vi' | 'en';
  returnUrl: string;
  cancelUrl: string;
}): Promise<{ id: string; approvalUrl: string }> {
  const data = await paypalRequest('/v1/billing/subscriptions', {
    method: 'POST',
    headers: { 'PayPal-Request-Id': crypto.randomUUID() },
    body: JSON.stringify({
      plan_id: paypalPlanId(),
      custom_id: input.userId,
      application_context: {
        brand_name: 'Numina',
        locale: input.locale === 'vi' ? 'vi-VN' : 'en-US',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'SUBSCRIBE_NOW',
        return_url: input.returnUrl,
        cancel_url: input.cancelUrl
      }
    })
  });
  const links = Array.isArray(data.links) ? data.links as JsonRecord[] : [];
  const approvalUrl = links.find((link) => link.rel === 'approve')?.href;
  if (typeof data.id !== 'string' || typeof approvalUrl !== 'string') {
    throw new Error('PayPal did not return an approval URL.');
  }
  return { id: data.id, approvalUrl };
}

export async function getPayPalSubscription(subscriptionId: string): Promise<JsonRecord> {
  return paypalRequest(`/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}`);
}

export async function cancelPayPalSubscription(subscriptionId: string, reason: string): Promise<void> {
  await paypalRequest(`/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  });
}

export async function verifyPayPalWebhook(
  headers: Headers,
  webhookEvent: JsonRecord
): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID?.trim();
  if (!webhookId) return false;
  const required = {
    auth_algo: headers.get('paypal-auth-algo'),
    cert_url: headers.get('paypal-cert-url'),
    transmission_id: headers.get('paypal-transmission-id'),
    transmission_sig: headers.get('paypal-transmission-sig'),
    transmission_time: headers.get('paypal-transmission-time')
  };
  if (Object.values(required).some((value) => !value)) return false;
  const result = await paypalRequest('/v1/notifications/verify-webhook-signature', {
    method: 'POST',
    body: JSON.stringify({ ...required, webhook_id: webhookId, webhook_event: webhookEvent })
  });
  return result.verification_status === 'SUCCESS';
}

export function paypalEventSubscriptionId(resource: JsonRecord): string | null {
  for (const value of [resource.id, resource.billing_agreement_id, resource.subscription_id]) {
    if (typeof value === 'string' && value.startsWith('I-')) return value;
  }
  return null;
}

export function paypalNextBillingTime(resource: JsonRecord): string | null {
  const billingInfo = resource.billing_info as JsonRecord | undefined;
  return typeof billingInfo?.next_billing_time === 'string' ? billingInfo.next_billing_time : null;
}
