import { isIP } from 'node:net';
import { promises as dns } from 'node:dns';

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'metadata.google.internal',
  'metadata.google.com',
  'instance-data.ec2.internal'
]);

function isBlockedIpv4(hostname: string): boolean {
  const parts = hostname.split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false;
  }
  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254) ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function isBlockedIpv6(hostname: string): boolean {
  const normalized = hostname.replace(/^\[|\]$/g, '').toLowerCase();
  return (
    normalized === '::' ||
    normalized === '::1' ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    normalized.startsWith('fe80:') ||
    normalized.startsWith('ff')
  );
}

/** Validate user-supplied provider URLs before the server makes an outbound request. */
export function validateProviderBaseUrl(rawValue: string): string {
  if (typeof rawValue !== 'string' || rawValue.trim().length === 0 || rawValue.length > 2048) {
    throw new Error('Provider URL is invalid.');
  }

  let url: URL;
  try {
    url = new URL(rawValue.trim());
  } catch {
    throw new Error('Provider URL must be a valid http(s) URL.');
  }

  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('Provider URL must use http(s) without embedded credentials.');
  }

  const hostname = url.hostname.toLowerCase();
  if (
    BLOCKED_HOSTNAMES.has(hostname) ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal')
  ) {
    throw new Error('Private or internal provider hosts are not allowed.');
  }

  const ipVersion = isIP(hostname.replace(/^\[|\]$/g, ''));
  if ((ipVersion === 4 && isBlockedIpv4(hostname)) || (ipVersion === 6 && isBlockedIpv6(hostname))) {
    throw new Error('Private or reserved provider IPs are not allowed.');
  }

  return url.toString().replace(/\/$/, '');
}

/**
 * Resolve provider hosts before proxying a request. This closes the common
 * DNS-to-private-network SSRF path; redirects are disabled at the fetch site.
 */
export async function validateResolvedProviderUrl(rawValue: string): Promise<string> {
  const normalized = validateProviderBaseUrl(rawValue);
  const hostname = new URL(normalized).hostname;
  if (isIP(hostname.replace(/^\[|\]$/g, ''))) return normalized;

  let addresses: Array<{ address: string; family: number }>;
  try {
    addresses = await dns.lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new Error('Provider host could not be resolved.');
  }
  if (addresses.length === 0 || addresses.some(({ address, family }) =>
    (family === 4 && isBlockedIpv4(address)) || (family === 6 && isBlockedIpv6(address))
  )) {
    throw new Error('Provider host resolves to a private or reserved address.');
  }
  return normalized;
}
