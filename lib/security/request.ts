import type { NextRequest } from 'next/server';

export const DEFAULT_JSON_LIMIT_BYTES = 256 * 1024;

export function getClientIp(request: NextRequest): string {
  const platformIp = (request as NextRequest & { ip?: string }).ip?.trim();
  if (platformIp) return platformIp;

  // Only trust forwarding headers when the deployment proxy is known to
  // overwrite them. Direct clients can otherwise rotate these values and
  // bypass anonymous quotas.
  if (process.env.NUMINA_TRUST_PROXY_HEADERS === 'true') {
    const forwarded = request.headers.get('x-forwarded-for');
    return forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip')?.trim() || 'unknown';
  }
  return 'unknown';
}

export async function readJsonBody<T>(
  request: NextRequest,
  maxBytes = DEFAULT_JSON_LIMIT_BYTES
): Promise<T> {
  const text = await readTextBody(request, maxBytes);

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new InvalidJsonError('Request body must be valid JSON.');
  }
}

export async function readTextBody(
  request: NextRequest,
  maxBytes = DEFAULT_JSON_LIMIT_BYTES
): Promise<string> {
  const declaredLength = Number(request.headers.get('content-length') || 0);
  if (declaredLength > maxBytes) {
    throw new RequestLimitError(`Request body exceeds ${maxBytes} bytes.`);
  }

  const reader = request.body?.getReader();
  if (!reader) throw new InvalidJsonError('Request body is empty.');
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel();
        throw new RequestLimitError(`Request body exceeds ${maxBytes} bytes.`);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const buffer = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(buffer);
}

export class RequestLimitError extends Error {
  readonly status = 413;
}

export class InvalidJsonError extends Error {
  readonly status = 400;
}

export function requestLimitResponse(error: unknown): Response | null {
  if (!(error instanceof RequestLimitError) && !(error instanceof InvalidJsonError)) return null;
  return new Response(JSON.stringify({ error: error.message }), {
    status: error.status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export function isValidLocale(value: unknown): value is 'vi' | 'en' {
  return value === 'vi' || value === 'en';
}
