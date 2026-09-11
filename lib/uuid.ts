/**
 * Safely generate a UUID v4 string across browser and server environments.
 *
 * In browsers, `crypto.randomUUID()` is restricted to Secure Contexts (HTTPS and localhost).
 * When accessed over non-secure HTTP (such as local network IP `http://192.168.x.x:3200`)
 * or in older browsers/webviews, `crypto.randomUUID` is undefined and throws:
 * `TypeError: crypto.randomUUID is not a function`.
 *
 * This utility provides fallback tiers:
 * 1. Native `crypto.randomUUID()` (modern Secure Contexts and Node.js)
 * 2. `crypto.getRandomValues()` (supported even in non-secure HTTP in almost all browsers)
 * 3. Pseudo-random fallback based on Math.random (guaranteed never to throw)
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined') {
    if (typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }

    if (typeof crypto.getRandomValues === 'function') {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      // Set version to 0100 (UUIDv4)
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      // Set variant to 10xx (RFC4122)
      bytes[8] = (bytes[8] & 0x3f) | 0x80;

      const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const safeRandomUUID = generateUUID;
