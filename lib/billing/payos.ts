const PAYOS_API = 'https://api-merchant.payos.vn';

function cleanEnv(value?: string): string | undefined {
  if (!value) return undefined;
  let trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    trimmed = trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function payosConfig() {
  const clientId = cleanEnv(process.env.PAYOS_CLIENT_ID);
  const apiKey = cleanEnv(process.env.PAYOS_API_KEY);
  const checksumKey = cleanEnv(process.env.PAYOS_CHECKSUM_KEY);
  if (!clientId || !apiKey || !checksumKey) throw new Error('payOS is not configured.');
  return { clientId, apiKey, checksumKey };
}

function checksumValue(value: unknown): string {
  if (value === null || value === undefined || value === 'null' || value === 'undefined') return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function buildPayOSChecksumData(data: Record<string, unknown>): string {
  return Object.keys(data)
    .filter((key) => data[key] !== undefined)
    .sort()
    .map((key) => `${key}=${checksumValue(data[key])}`)
    .join('&');
}

async function hmacSha256Hex(secret: string, value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(signature)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function createPayOSOrderCode(now = Date.now()): number {
  return now * 1000 + crypto.getRandomValues(new Uint16Array(1))[0] % 1000;
}

export async function createPayOSPaymentLink(input: {
  orderCode: number;
  amount: number;
  description: string;
  returnUrl: string;
  cancelUrl: string;
  expiresAt: number;
}): Promise<{ checkoutUrl: string; qrCode: string; paymentLinkId: string }> {
  const config = payosConfig();
  const signable = {
    amount: input.amount,
    cancelUrl: input.cancelUrl,
    description: input.description,
    orderCode: input.orderCode,
    returnUrl: input.returnUrl
  };
  const signature = await hmacSha256Hex(config.checksumKey, buildPayOSChecksumData(signable));
  const response = await fetch(`${PAYOS_API}/v2/payment-requests`, {
    method: 'POST',
    headers: {
      'x-client-id': config.clientId,
      'x-api-key': config.apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ...signable, expiredAt: input.expiresAt, signature }),
    signal: AbortSignal.timeout(15_000)
  });
  const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
  const data = payload.data as Record<string, unknown> | undefined;
  if (!response.ok || payload.code !== '00' || !data) throw new Error('payOS could not create a payment link.');
  if (typeof data.checkoutUrl !== 'string' || typeof data.qrCode !== 'string' || typeof data.paymentLinkId !== 'string') {
    throw new Error('payOS returned an incomplete payment link.');
  }
  return { checkoutUrl: data.checkoutUrl, qrCode: data.qrCode, paymentLinkId: data.paymentLinkId };
}

export async function verifyPayOSWebhook(
  data: Record<string, unknown>,
  providedSignature: string
): Promise<boolean> {
  const { checksumKey } = payosConfig();
  if (!/^[a-f0-9]{64}$/i.test(providedSignature)) {
    return false;
  }
  const dataString = buildPayOSChecksumData(data);
  const computedSignature = await hmacSha256Hex(checksumKey, dataString);
  return computedSignature.toLowerCase() === providedSignature.trim().toLowerCase();
}
