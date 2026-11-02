import Link from 'next/link';
import { LandingBottom, LandingTop } from '@/components/HomeSections';
import { Pagination } from '@/components/Pagination';
import { PropertyCard } from '@/components/PropertyCard';
import { SearchHero } from '@/components/SearchHero';
import { searchProperties } from '@/lib/api';
import { capitalize } from '@/lib/format';
import { primaryButton } from '@/lib/styles';

const LANDING_LIMIT = '6';

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HomePage({ searchParams }: Props) {
  const params = await searchParams;

  // Empty form fields are left out, because the API rejects an empty number.
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string' && value !== '') query.set(key, value);
  }

  // The page number is only for display. The cursor is what fetches the right listings,
  // so the number stays out of the API call.
  const pageNumber = Number(query.get('page'));
  const page = Number.isInteger(pageNumber) && pageNumber > 1 ? pageNumber : 1;
  query.delete('page');

  // With no search values, this is a first visit, so the page shows a short preview of listings.
  const landing = query.size === 0;
  if (landing) query.set('limit', LANDING_LIMIT);

  const { items, nextCursor } = await searchProperties(query);

  const nextQuery = new URLSearchParams(query);
  if (nextCursor) nextQuery.set('cursor', nextCursor);
  nextQuery.set('page', String(page + 1));

  // A cursor in the URL means this isn't the first page.
  const isLaterPage = query.has('cursor');
  const firstQuery = new URLSearchParams(query);
  firstQuery.delete('cursor');

  const text = (name: string) => {
    const value = params[name];
    return typeof value === 'string' ? value : '';
  };

  const city = text('city');

  return (
    <main className="w-full">
      <SearchHero text={text} landing={landing} />

      {landing && <LandingTop />}

      <section className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-4xl font-light text-gray-950">
            {city ? `Properties in ${capitalize(city)}` : landing ? 'Explore our latest properties' : 'Search results'}
          </h2>
          {landing && (
            <Link href="/?sort=newest" className={primaryButton}>
              See all properties <span aria-hidden="true">→</span>
            </Link>
          )}
        </div>

        {items.length === 0 ? (
          <p className="rounded-2xl bg-gray-100 p-8 text-center text-gray-600">No properties match your search.</p>
        ) : (
          <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}

        {!landing && (isLaterPage || nextCursor) && (
          <Pagination
            page={page}
            count={items.length}
            firstHref={isLaterPage ? `/?${firstQuery}` : undefined}
            nextHref={nextCursor ? `/?${nextQuery}` : undefined}
          />
        )}
      </section>

      {landing && <LandingBottom />}
    </main>
  );
}
