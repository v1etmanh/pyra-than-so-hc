const DEFAULT_AUTH_REDIRECT = '/account';

/**
 * Accepts only same-site absolute paths for post-auth redirects.
 * Reject protocol-relative URLs, backslashes, and control characters because
 * browsers can normalize them into an external destination.
 */
export function safeAuthRedirectPath(value: string | null | undefined): string {
  if (
    !value ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\') ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    return DEFAULT_AUTH_REDIRECT;
  }

  return value;
}
