import Image from 'next/image';
import Link from 'next/link';
import { SamplePhoto } from '@/components/SamplePhoto';
import { capitalize, formatBedrooms, formatPrice } from '@/lib/format';
import type { PropertySummary } from '@/lib/types';

const SIZES = '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw';

export function PropertyCard({ property }: { property: PropertySummary }) {
  const bedrooms = formatBedrooms(property.bedrooms, property.type);

  return (
    <Link href={`/properties/${property.slug}`} className="group block">
      <article>
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100">
          {property.coverImage ? (
            <Image
              src={property.coverImage}
              alt={property.title}
              fill
              sizes={SIZES}
              className="object-cover transition duration-300 motion-safe:group-hover:scale-105"
            />
          ) : (
            <SamplePhoto id={property.id} type={property.type} sizes={SIZES} />
          )}
          <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-900 shadow">
            {capitalize(property.type)}
          </span>
        </div>
        <div className="pt-3">
          <h2 className="text-lg font-semibold text-gray-950 group-hover:underline">{property.title}</h2>
          <p className="mt-1 text-sm text-gray-600">
            <span className="mr-2 font-bold text-gray-950">{formatPrice(property.price)}</span>
            <span className="capitalize">{property.locality}, {property.city}</span>
          </p>
          {bedrooms && <p className="mt-1 text-sm text-gray-600">{bedrooms}</p>}
        </div>
      </article>
    </Link>
  );
}
