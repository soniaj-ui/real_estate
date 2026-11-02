'use client';

import { primaryButton } from '@/lib/styles';

export default function Error({ retry }: { retry: () => void }) {
  return (
    <div className="mx-auto w-full max-w-6xl p-4">
      <p className="mb-3 text-gray-900">Something went wrong. Check your search and try again.</p>
      <button onClick={() => retry()} className={primaryButton}>
        Try again
      </button>
    </div>
  );
}
