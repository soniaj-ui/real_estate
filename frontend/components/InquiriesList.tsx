'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FormError } from '@/components/FormError';
import { RequireAuth } from '@/components/RequireAuth';
import { apiFetch } from '@/lib/client';
import { formatDate } from '@/lib/format';
import { primaryButton, secondaryButton } from '@/lib/styles';
import type { Inquiry, Page } from '@/lib/types';

type Tab = 'received' | 'sent';

function InquiryRows({ tab }: { tab: Tab }) {
  const [items, setItems] = useState<Inquiry[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    apiFetch<Page<Inquiry>>(`/inquiries/${tab}`)
      .then((page) => {
        setItems(page.items);
        setNextCursor(page.nextCursor);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [tab]);

  async function loadMore() {
    setLoading(true);
    try {
      const page = await apiFetch<Page<Inquiry>>(`/inquiries/${tab}?cursor=${nextCursor}`);
      setItems((current) => [...current, ...page.items]);
      setNextCursor(page.nextCursor);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <FormError error={error} />

      {!loading && !error && items.length === 0 && (
        <p className="text-gray-600">
          {tab === 'received' ? 'No one has contacted you yet.' : "You haven't contacted anyone yet."}
        </p>
      )}

      <ul className="space-y-3">
        {items.map((inquiry) => (
          <li key={inquiry.id} className="rounded-2xl border border-gray-200 bg-white p-4">
            <Link href={`/properties/${inquiry.property_slug}`} className="font-semibold text-gray-900 hover:text-emerald-800">
              {inquiry.property_title}
            </Link>
            <p className="mt-1 whitespace-pre-line text-sm text-gray-800">{inquiry.message}</p>
            <p className="mt-2 text-xs text-gray-600">
              {inquiry.sender_name && (
                <>
                  From {inquiry.sender_name} (
                  <a href={`mailto:${inquiry.sender_email}`} className="text-emerald-800 hover:underline">
                    {inquiry.sender_email}
                  </a>
                  ) ·{' '}
                </>
              )}
              {formatDate(inquiry.created_at)}
            </p>
          </li>
        ))}
      </ul>

      {loading && <p className="mt-3 text-gray-600">Loading...</p>}

      {nextCursor && !loading && (
        <div className="mt-6 text-center">
          <button onClick={loadMore} className={secondaryButton}>Load more</button>
        </div>
      )}
    </>
  );
}

export function InquiriesList() {
  const [tab, setTab] = useState<Tab>('received');

  return (
    <RequireAuth>
      <main className="mx-auto w-full max-w-3xl p-4">
        <h1 className="mb-4 text-2xl font-bold text-gray-900">Inquiries</h1>
        <div className="mb-4 flex gap-2">
          <button onClick={() => setTab('received')} className={tab === 'received' ? primaryButton : secondaryButton}>
            Received
          </button>
          <button onClick={() => setTab('sent')} className={tab === 'sent' ? primaryButton : secondaryButton}>
            Sent
          </button>
        </div>
        {/* A new key gives each tab a fresh component, so one tab's rows never show under the other. */}
        <InquiryRows key={tab} tab={tab} />
      </main>
    </RequireAuth>
  );
}
