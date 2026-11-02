'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FormError } from '@/components/FormError';
import { RequireAuth } from '@/components/RequireAuth';
import { SamplePhoto } from '@/components/SamplePhoto';
import { apiFetch } from '@/lib/client';
import { capitalize, formatDate, formatPrice } from '@/lib/format';
import { primaryButton, secondaryButton } from '@/lib/styles';
import type { Inquiry, Page } from '@/lib/types';

type Tab = 'received' | 'sent';

const TABS: { value: Tab; label: string; intro: string }[] = [
  { value: 'received', label: 'Received', intro: 'Messages from people interested in your listings.' },
  { value: 'sent', label: 'Sent', intro: 'Messages you sent to the owners of other listings.' },
];

const PHOTO_SIZES = '(min-width: 640px) 208px, 100vw';

function InquiryCard({ inquiry }: { inquiry: Inquiry }) {
  const listingLink = `/properties/${inquiry.property_slug}`;
  const replySubject = encodeURIComponent(`Your inquiry about ${inquiry.property_title}`);

  return (
    <li className="group flex flex-col gap-5 rounded-3xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row">
      <Link href={listingLink} className="relative block aspect-[4/3] shrink-0 overflow-hidden rounded-2xl bg-gray-100 sm:w-52 sm:self-start">
        {inquiry.coverImage ? (
          <Image src={inquiry.coverImage} alt={inquiry.property_title} fill sizes={PHOTO_SIZES} className="object-cover" />
        ) : (
          <SamplePhoto id={inquiry.property_id} type={inquiry.property_type} sizes={PHOTO_SIZES} />
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
          <Link href={listingLink} className="text-xl font-semibold text-gray-950 hover:underline">
            {inquiry.property_title}
          </Link>
          <p className="text-sm text-gray-600">{formatDate(inquiry.created_at)}</p>
        </div>
        <p className="mt-1 text-sm text-gray-700">
          <span className="font-semibold text-gray-950">{formatPrice(inquiry.property_price)}</span>
          {' · '}
          {capitalize(inquiry.property_locality)}, {capitalize(inquiry.property_city)}
        </p>

        <p className="mt-4 whitespace-pre-line rounded-2xl bg-gray-100 p-4 text-sm leading-relaxed text-gray-800">{inquiry.message}</p>

        {/* Only received inquiries have sender details, because the API leaves them out of sent ones. */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          {inquiry.sender_name ? (
            <>
              <div className="flex min-w-0 items-center gap-3">
                <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lime-300 font-semibold uppercase text-gray-950">
                  {inquiry.sender_name[0]}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-950">{inquiry.sender_name}</p>
                  <p className="truncate text-sm text-gray-600">{inquiry.sender_email}</p>
                </div>
              </div>
              <a href={`mailto:${inquiry.sender_email}?subject=${replySubject}`} className={primaryButton}>
                Reply by email
              </a>
            </>
          ) : (
            <Link href={listingLink} className={secondaryButton}>
              View listing
            </Link>
          )}
        </div>
      </div>
    </li>
  );
}

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
        <div className="rounded-3xl bg-gray-100 p-10 text-center">
          <p className="text-xl font-semibold text-gray-950">
            {tab === 'received' ? 'No one has contacted you yet' : "You haven't contacted anyone yet"}
          </p>
          <p className="mb-6 mt-2 text-sm text-gray-600">
            {tab === 'received' ? 'When someone messages you about a listing, it appears here.' : 'Open a listing you like and send its owner a message.'}
          </p>
          <Link href={tab === 'received' ? '/my-listings' : '/?sort=newest'} className={primaryButton}>
            {tab === 'received' ? 'See my listings' : 'Browse properties'}
          </Link>
        </div>
      )}

      <ul className="space-y-4">
        {items.map((inquiry) => (
          <InquiryCard key={inquiry.id} inquiry={inquiry} />
        ))}
      </ul>

      {loading && <div className="mt-4 h-52 animate-pulse rounded-3xl bg-gray-100" />}

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
  const intro = TABS.find((item) => item.value === tab)?.intro;

  return (
    <RequireAuth>
      <main className="mx-auto w-full max-w-4xl p-4 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-light text-gray-950">Inquiries</h1>
            <p className="mt-1 text-sm text-gray-600">{intro}</p>
          </div>
          <div className="flex rounded-full bg-gray-100 p-1">
            {TABS.map((item) => (
              <button
                key={item.value}
                onClick={() => setTab(item.value)}
                aria-pressed={tab === item.value}
                className={`rounded-full px-5 py-2 text-sm font-semibold ${tab === item.value ? 'bg-gray-950 text-white' : 'text-gray-700 hover:text-gray-950'}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        {/* A new key gives each tab a fresh component, so one tab's rows never show under the other. */}
        <InquiryRows key={tab} tab={tab} />
      </main>
    </RequireAuth>
  );
}
