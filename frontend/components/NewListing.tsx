'use client';

import { useRouter } from 'next/navigation';
import { PropertyForm, type PropertyFormValues } from '@/components/PropertyForm';
import { RequireAuth } from '@/components/RequireAuth';
import { sendJson } from '@/lib/client';
import type { Property } from '@/lib/types';

export function NewListing() {
  const router = useRouter();

  async function handleSubmit(values: PropertyFormValues) {
    const data = await sendJson<{ property: Property }>('/properties', 'POST', values);
    // Next stop is the edit page, where photos can be added.
    router.push(`/listings/${data.property.id}/edit`);
  }

  return (
    <RequireAuth>
      <main className="mx-auto w-full max-w-2xl p-4">
        <h1 className="mb-4 text-2xl font-bold text-gray-900">Post a listing</h1>
        <PropertyForm submitLabel="Create listing" onSubmit={handleSubmit} />
      </main>
    </RequireAuth>
  );
}
