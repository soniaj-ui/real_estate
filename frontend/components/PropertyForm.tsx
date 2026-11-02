'use client';

import { useState, type FormEvent } from 'react';
import { FormError } from '@/components/FormError';
import { inputClass, labelClass, primaryButton } from '@/lib/styles';
import type { Property } from '@/lib/types';

export type PropertyFormValues = {
  title: string;
  description: string;
  city: string;
  locality: string;
  type: string;
  price: number;
  bedrooms: number;
  status?: string;
};

type Props = {
  // Filled in when editing, and missing when creating.
  property?: Property;
  submitLabel: string;
  onSubmit: (values: PropertyFormValues) => Promise<void>;
};

export function PropertyForm({ property, submitLabel, onSubmit }: Props) {
  const [error, setError] = useState<unknown>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const values: PropertyFormValues = {
      title: String(form.get('title')),
      description: String(form.get('description')),
      city: String(form.get('city')),
      locality: String(form.get('locality')),
      type: String(form.get('type')),
      price: Number(form.get('price')),
      bedrooms: Number(form.get('bedrooms')),
    };
    if (property) values.status = String(form.get('status'));

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(values);
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className={labelClass}>Title</label>
        <input id="title" name="title" required minLength={5} maxLength={150} defaultValue={property?.title} className={inputClass} />
      </div>
      <div>
        <label htmlFor="description" className={labelClass}>Description</label>
        <textarea id="description" name="description" rows={4} maxLength={5000} defaultValue={property?.description} className={inputClass} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="city" className={labelClass}>City</label>
          <input id="city" name="city" required minLength={2} maxLength={100} defaultValue={property?.city} className={`${inputClass} capitalize`} />
        </div>
        <div>
          <label htmlFor="locality" className={labelClass}>Locality</label>
          <input id="locality" name="locality" required minLength={2} maxLength={100} defaultValue={property?.locality} className={inputClass} />
        </div>
        <div>
          <label htmlFor="type" className={labelClass}>Property type</label>
          <select id="type" name="type" defaultValue={property?.type ?? 'apartment'} className={inputClass}>
            <option value="apartment">Apartment</option>
            <option value="villa">Villa</option>
            <option value="plot">Plot</option>
            <option value="commercial">Commercial</option>
          </select>
        </div>
        <div>
          <label htmlFor="price" className={labelClass}>Price (₹)</label>
          <input id="price" name="price" type="number" required min={0} step={1} defaultValue={property?.price} className={inputClass} />
        </div>
        <div>
          <label htmlFor="bedrooms" className={labelClass}>Bedrooms</label>
          <input id="bedrooms" name="bedrooms" type="number" required min={0} max={50} step={1} defaultValue={property?.bedrooms} className={inputClass} />
        </div>
        {property && (
          <div>
            <label htmlFor="status" className={labelClass}>Visibility</label>
            <select id="status" name="status" defaultValue={property.status} className={inputClass}>
              <option value="active">Active: shown to everyone</option>
              <option value="inactive">Inactive: hidden</option>
            </select>
          </div>
        )}
      </div>

      <FormError error={error} />

      <button disabled={submitting} className={primaryButton}>
        {submitting ? 'Saving...' : submitLabel}
      </button>
    </form>
  );
}
