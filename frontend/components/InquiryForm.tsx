'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { FormError } from '@/components/FormError';
import { useAuth } from '@/lib/auth';
import { ApiError, sendJson } from '@/lib/client';
import { inputClass, labelClass, primaryButton, secondaryButton } from '@/lib/styles';

type Props = {
  propertyId: string;
  ownerId: string;
};

export function InquiryForm({ propertyId, ownerId }: Props) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const [error, setError] = useState<unknown>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    setSubmitting(true);
    setError(null);
    try {
      await sendJson(`/properties/${propertyId}/inquiries`, 'POST', {
        message: String(form.get('message')),
        website: String(form.get('website')),
      });
      setSent(true);
    } catch (err) {
      // A duplicate means the owner already has the message, so it isn't really a failure.
      if (err instanceof ApiError && err.status === 409) setSent(true);
      else setError(err);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return null;

  if (!user) {
    return (
      <Link href={`/login?next=${encodeURIComponent(pathname)}`} className={secondaryButton}>
        Log in to contact the owner
      </Link>
    );
  }

  if (user.id === ownerId) {
    return (
      <Link href={`/listings/${propertyId}/edit`} className={secondaryButton}>
        Edit your listing
      </Link>
    );
  }

  if (sent) {
    return (
      <p role="status" className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-900">
        Your message has been sent to the owner.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="message" className={labelClass}>Message to the owner</label>
        <textarea
          id="message"
          name="message"
          rows={4}
          required
          minLength={10}
          maxLength={1000}
          defaultValue="Hi, I'm interested in this property. Please share more details."
          className={inputClass}
        />
      </div>

      {/* A spam trap: people can't see this field, so only bots fill it in. */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />

      <FormError error={error} />

      <button disabled={submitting} className={primaryButton}>
        {submitting ? 'Sending...' : 'Send message'}
      </button>
    </form>
  );
}
