'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';

type Props = {
  propertyId: string;
  ownerId: string;
};

// The listing page is cached and the same for everyone, so only the browser can tell if this is the owner.
export function EditListingLink({ propertyId, ownerId }: Props) {
  const { user } = useAuth();

  if (user?.id !== ownerId) return null;

  return (
    <Link
      href={`/listings/${propertyId}/edit`}
      aria-label="Edit listing"
      title="Edit listing"
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-900 hover:bg-gray-950 hover:text-white"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </svg>
    </Link>
  );
}
