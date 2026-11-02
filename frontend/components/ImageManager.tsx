'use client';

import Image from 'next/image';
import { useState, type ChangeEvent } from 'react';
import { FormError } from '@/components/FormError';
import { apiFetch } from '@/lib/client';
import { dangerButton, labelClass } from '@/lib/styles';
import type { PropertyImage } from '@/lib/types';

type Props = {
  propertyId: string;
  initialImages: PropertyImage[];
};

export function ImageManager({ propertyId, initialImages }: Props) {
  const [images, setImages] = useState(initialImages);
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    const form = new FormData();
    form.append('image', file);

    setBusy(true);
    setError(null);
    try {
      const data = await apiFetch<{ image: PropertyImage }>(`/properties/${propertyId}/images`, {
        method: 'POST',
        body: form,
      });
      setImages((current) => [...current, data.image]);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
      input.value = '';
    }
  }

  async function handleDelete(imageId: string) {
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/properties/${propertyId}/images/${imageId}`, { method: 'DELETE' });
      setImages((current) => current.filter((image) => image.id !== imageId));
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-lg font-semibold text-gray-900">Photos</h2>

      {images.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((image) => (
            <div key={image.id}>
              <div className="relative aspect-video overflow-hidden rounded-xl bg-gray-100">
                <Image src={image.url} alt="Listing photo" fill sizes="(min-width: 640px) 33vw, 50vw" className="object-cover" />
              </div>
              <button onClick={() => handleDelete(image.id)} disabled={busy} className={`${dangerButton} mt-2`}>
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <label htmlFor="image" className={labelClass}>Add a photo (JPEG, PNG or WebP, up to 5 MB)</label>
      <input
        id="image"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleUpload}
        disabled={busy}
        className="block w-full text-sm text-gray-800"
      />
      {busy && <p className="mt-2 text-sm text-gray-600">Please wait...</p>}

      <div className="mt-3">
        <FormError error={error} />
      </div>
    </section>
  );
}
