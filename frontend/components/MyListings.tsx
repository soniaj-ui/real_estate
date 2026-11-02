'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FormError } from '@/components/FormError';
import { RequireAuth } from '@/components/RequireAuth';
import { apiFetch } from '@/lib/client';
import { formatPrice } from '@/lib/format';
import { dangerButton, primaryButton, secondaryButton } from '@/lib/styles';
import type { Page, Property } from '@/lib/types';

function ListingRows() {
  const [items, setItems] = useState<Property[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  async function loadPage(cursor?: string) {
    setLoading(true);
    try {
      const path = cursor ? `/properties/mine?cursor=${cursor}` : '/properties/mine';
      const page = await apiFetch<Page<Property>>(path);
      setItems((current) => [...current, ...page.items]);
      setNextCursor(page.nextCursor);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    apiFetch<Page<Property>>('/properties/mine')
      .then((page) => {
        setItems(page.items);
        setNextCursor(page.nextCursor);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(property: Property) {
    if (!window.confirm(`Delete "${property.title}"? This can't be undone.`)) return;
    try {
      await apiFetch(`/properties/${property.id}`, { method: 'DELETE' });
      setItems((current) => current.filter((item) => item.id !== property.id));
    } catch (err) {
      setError(err);
    }
  }

  return (
    <>
      <FormError error={error} />

      {!loading && !error && items.length === 0 && (
        <p className="text-gray-600">You haven&apos;t posted a listing yet.</p>
      )}

      <ul className="space-y-3">
        {items.map((property) => (
          <li key={property.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4">
            <div className="mr-auto">
              <h2 className="font-semibold text-gray-900">{property.title}</h2>
              <p className="text-sm capitalize text-gray-600">
                {property.locality}, {property.city} · {formatPrice(property.price)}
              </p>
              {property.status === 'inactive' && <p className="text-sm font-medium text-amber-800">Hidden</p>}
            </div>
            <Link href={`/listings/${property.id}/edit`} className={secondaryButton}>Edit</Link>
            <button onClick={() => handleDelete(property)} className={dangerButton}>Delete</button>
          </li>
        ))}
      </ul>

      {loading && <p className="mt-3 text-gray-600">Loading...</p>}

      {nextCursor && !loading && (
        <div className="mt-6 text-center">
          <button onClick={() => loadPage(nextCursor)} className={secondaryButton}>Load more</button>
        </div>
      )}
    </>
  );
}

export function MyListings() {
  return (
    <RequireAuth>
      <main className="mx-auto w-full max-w-3xl p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-bold text-gray-900">My listings</h1>
          <Link href="/listings/new" className={primaryButton}>Post a listing</Link>
        </div>
        <ListingRows />
      </main>
    </RequireAuth>
  );
}
