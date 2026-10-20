/**
 * Utility to detect if the current running application is on a local developer environment
 * (e.g. localhost, 127.0.0.1) or deployed in a production/staging environment (e.g. Vercel).
 */
export const isLocalUrl = (): boolean => {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '[::1]' ||
    host.endsWith('.local')
  );
};
