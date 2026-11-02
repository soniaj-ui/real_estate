import type { Page, Property, PropertySummary } from './types';

// This file runs on the Next.js server, for public pages. Browser code uses client.ts.
const API_URL = process.env.API_URL ?? 'http://localhost:4000/api/v1';

// How long a cached listing is reused before it's fetched again, in seconds.
const CACHE_SECONDS = 300;

export async function searchProperties(query: URLSearchParams): Promise<Page<PropertySummary>> {
  const res = await fetch(`${API_URL}/properties?${query}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Could not load listings');
  return res.json();
}

export async function getProperty(slug: string): Promise<Property | null> {
  const res = await fetch(`${API_URL}/properties/${encodeURIComponent(slug)}`, {
    next: { revalidate: CACHE_SECONDS },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Could not load this listing');
  const data = await res.json();
  return data.property;
}

export async function getSimilarProperties(slug: string): Promise<PropertySummary[]> {
  const res = await fetch(`${API_URL}/properties/${encodeURIComponent(slug)}/similar`, {
    next: { revalidate: CACHE_SECONDS },
  });
  // The listing page still works without this section.
  if (!res.ok) return [];
  const data = await res.json();
  return data.items;
}

export async function getSitemapEntries(): Promise<{ slug: string; updated_at: string }[]> {
  const res = await fetch(`${API_URL}/properties/sitemap`, { cache: 'no-store' });
  if (!res.ok) return [];
  const data = await res.json();
  return data.items;
}
