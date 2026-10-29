import { createHash, createHmac, createSign } from 'node:crypto';
import { GOOGLE_PLAY_PRODUCT_ID } from './types.ts';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const ANDROID_PUBLISHER_SCOPE = 'https://www.googleapis.com/auth/androidpublisher';

type ServiceAccount = { client_email: string; private_key: string };

export type GooglePlaySubscription = {
  subscriptionState?: string;
  acknowledgementState?: string;
  startTime?: string;
  latestOrderId?: string;
  linkedPurchaseToken?: string;
  lineItems?: Array<{ productId?: string; expiryTime?: string; autoRenewingPlan?: { autoRenewEnabled?: boolean } }>;
  externalAccountIdentifiers?: { obfuscatedExternalAccountId?: string };
};

function base64Url(value: string | Buffer): string {
  return Buffer.from(value).toString('base64url');
}
function serviceAccount(): ServiceAccount {
  const raw = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) throw new Error('GOOGLE_PLAY_SERVICE_ACCOUNT_JSON is not configured.');
  const parsed = JSON.parse(raw) as Partial<ServiceAccount>;
  if (!parsed.client_email || !parsed.private_key) throw new Error('Google Play service account JSON is invalid.');
  return { client_email: parsed.client_email, private_key: parsed.private_key.replace(/\\n/g, '\n') };
}

async function accessToken(): Promise<string> {
  const account = serviceAccount();
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64Url(JSON.stringify({
    iss: account.client_email,
    scope: ANDROID_PUBLISHER_SCOPE,
    aud: GOOGLE_TOKEN_URL,
    iat: now,
    exp: now + 3600,
  }));
  const unsigned = `${header}.${payload}`;
  const signer = createSign('RSA-SHA256');
  signer.update(unsigned);
  const assertion = `${unsigned}.${signer.sign(account.private_key, 'base64url')}`;
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
    signal: AbortSignal.timeout(15_000),
  });
  const data = await response.json() as { access_token?: string; error_description?: string };
  if (!response.ok || !data.access_token) throw new Error(data.error_description || 'Could not authenticate with Google Play.');
  return data.access_token;
}

export function hashPurchaseToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function obfuscatedGoogleAccountId(userId: string): string {
  const secret = process.env.GOOGLE_PLAY_ACCOUNT_LINK_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'numelyra-local';
  return createHmac('sha256', secret).update(userId).digest('hex');
}

export async function getGooglePlaySubscription(purchaseToken: string): Promise<GooglePlaySubscription> {
  const packageName = process.env.GOOGLE_PLAY_PACKAGE_NAME || 'online.numelyra.app';
  const token = await accessToken();
  const response = await fetch(
    `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(packageName)}/purchases/subscriptionsv2/tokens/${encodeURIComponent(purchaseToken)}`,
    { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15_000) },
  );
  const data = await response.json() as GooglePlaySubscription & { error?: { message?: string } };
  if (!response.ok) throw new Error(data.error?.message || 'Google Play purchase verification failed.');
  return data;
}

export async function acknowledgeGooglePlaySubscription(purchaseToken: string, productId = GOOGLE_PLAY_PRODUCT_ID) {
  const packageName = process.env.GOOGLE_PLAY_PACKAGE_NAME || 'online.numelyra.app';
  const token = await accessToken();
  const response = await fetch(
    `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(packageName)}/purchases/subscriptions/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}:acknowledge`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(15_000),
    },
  );
  if (!response.ok) {
    const data = await response.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(data.error?.message || 'Google Play acknowledgement failed.');
  }
}

export function googlePlayEntitlement(subscription: GooglePlaySubscription) {
  const state = String(subscription.subscriptionState || 'SUBSCRIPTION_STATE_UNSPECIFIED');
  // CANCELED means renewal is disabled but the already-paid entitlement
  // remains valid until expiry. Hold, pause, expiry, refund and revoke do not.
  const active = [
    'SUBSCRIPTION_STATE_ACTIVE',
    'SUBSCRIPTION_STATE_IN_GRACE_PERIOD',
    'SUBSCRIPTION_STATE_CANCELED',
  ].includes(state);
  const lineItem = subscription.lineItems?.find((item) => item.productId === GOOGLE_PLAY_PRODUCT_ID);
  const periodEnd = lineItem?.expiryTime ? new Date(lineItem.expiryTime) : null;
  return {
    active: active && Boolean(periodEnd && Number.isFinite(periodEnd.getTime()) && periodEnd > new Date()),
    state,
    periodStart: subscription.startTime || null,
    periodEnd: periodEnd?.toISOString() || null,
    autoRenewing: Boolean(lineItem?.autoRenewingPlan?.autoRenewEnabled),
    productId: lineItem?.productId || null,
  };
}

export async function verifyGooglePubSubBearer(request: Request): Promise<boolean> {
  const bearer = /^Bearer\s+(.+)$/i.exec(request.headers.get('authorization') || '')?.[1];
  const expectedAudience = process.env.GOOGLE_PLAY_RTDN_AUDIENCE;
  if (!bearer || !expectedAudience) return false;
  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(bearer)}`, {
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) return false;
  const claims = await response.json() as { aud?: string; email?: string; email_verified?: string | boolean };
  const expectedEmail = process.env.GOOGLE_PLAY_RTDN_SERVICE_ACCOUNT_EMAIL;
  return claims.aud === expectedAudience
    && (!expectedEmail || claims.email === expectedEmail)
    && (claims.email_verified === true || claims.email_verified === 'true');
}
