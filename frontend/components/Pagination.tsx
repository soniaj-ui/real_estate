import Link from 'next/link';
import { primaryButton, secondaryButton } from '@/lib/styles';

type Props = {
  page: number;
  // How many listings are on this page.
  count: number;
  // A missing link means there's nowhere to go in that direction.
  firstHref?: string;
  nextHref?: string;
};

export function Pagination({ page, count, firstHref, nextHref }: Props) {
  return (
    <nav aria-label="Pagination" className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-gray-100 p-4 md:px-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 min-w-11 items-center justify-center rounded-full bg-lime-300 px-2 font-semibold text-gray-950">{page}</span>
        <div>
          <p className="font-semibold text-gray-950">Page {page}</p>
          <p className="text-sm text-gray-600">{count} {count === 1 ? 'property' : 'properties'} shown</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {firstHref && (
          <Link href={firstHref} className={secondaryButton}>
            <span aria-hidden="true">←</span> First page
          </Link>
        )}
        {nextHref ? (
          <Link href={nextHref} className={primaryButton}>
            Next page <span aria-hidden="true">→</span>
          </Link>
        ) : (
          <span className="px-2 text-sm font-medium text-gray-600">End of results</span>
        )}
      </div>
    </nav>
  );
}
