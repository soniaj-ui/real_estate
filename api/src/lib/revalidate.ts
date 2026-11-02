import { config } from '../config';

const TIMEOUT = 3000;

// Tells the frontend to rebuild a cached page. It isn't awaited, because a slow or
// stopped frontend must not fail the edit. The page also refreshes by itself every 5 minutes.
export function revalidateProperty(slug: string) {
  if (!config.revalidateSecret) return;

  fetch(`${config.frontendUrl}/api/revalidate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-revalidate-secret': config.revalidateSecret },
    body: JSON.stringify({ slug }),
    signal: AbortSignal.timeout(TIMEOUT),
  }).catch((err) => console.error('Could not refresh the page', err.message));
}
