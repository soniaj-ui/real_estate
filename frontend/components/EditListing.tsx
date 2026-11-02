'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FormError } from '@/components/FormError';
import { ImageManager } from '@/components/ImageManager';
import { PropertyForm, type PropertyFormValues } from '@/components/PropertyForm';
import { RequireAuth } from '@/components/RequireAuth';
import { apiFetch, sendJson } from '@/lib/client';
import type { Property } from '@/lib/types';

function EditForm({ id }: { id: string }) {
  const [property, setProperty] = useState<Property | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiFetch<{ property: Property }>(`/properties/mine/${id}`)
      .then((data) => setProperty(data.property))
      .catch(setError);
  }, [id]);

  async function handleSubmit(values: PropertyFormValues) {
    setSaved(false);
    await sendJson(`/properties/${id}`, 'PATCH', values);
    setSaved(true);
  }

  if (error) return <FormError error={error} />;
  if (!property) return <p className="text-gray-600">Loading...</p>;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-gray-900">Edit listing</h1>
        <Link href={`/properties/${property.slug}`} className="text-sm font-medium text-emerald-800 hover:underline">
          View public page
        </Link>
      </div>
      <PropertyForm property={property} submitLabel="Save changes" onSubmit={handleSubmit} />
      {saved && <p role="status" className="mt-3 text-sm font-medium text-green-800">Your changes are saved.</p>}
      <ImageManager propertyId={id} initialImages={property.images} />
    </>
  );
}

export function EditListing({ id }: { id: string }) {
  return (
    <RequireAuth>
      <main className="mx-auto w-full max-w-2xl p-4">
        <EditForm id={id} />
      </main>
    </RequireAuth>
  );
}
