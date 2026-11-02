import type { MetadataRoute } from 'next';
import { getSitemapEntries } from '@/lib/api';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

// Rebuilt at most once an hour, so search engines don't cause a query on every visit.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = await getSitemapEntries();
  return [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
    ...entries.map((entry) => ({
      url: `${SITE_URL}/properties/${entry.slug}`,
      lastModified: entry.updated_at,
    })),
  ];
}
