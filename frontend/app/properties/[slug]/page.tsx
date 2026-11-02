import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { EditListingLink } from '@/components/EditListingLink';
import { InquiryForm } from '@/components/InquiryForm';
import { PropertyCard } from '@/components/PropertyCard';
import { SamplePhoto } from '@/components/SamplePhoto';
import { getProperty, getSimilarProperties } from '@/lib/api';
import { capitalize, formatBedrooms, formatDate, formatFullPrice, formatPrice } from '@/lib/format';

// ISR: the page is cached, then rebuilt at most every 5 minutes, or straight after an edit.
export const revalidate = 300;

// An empty list means no pages are built in advance. Each is built on its first visit.
export async function generateStaticParams() {
  return [];
}

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const property = await getProperty(slug);
  if (!property) return { title: 'Listing not found' };

  const title = `${property.title} in ${property.locality}, ${capitalize(property.city)}`;
  const description =
    property.description.slice(0, 155) ||
    `${capitalize(property.type)} for ${formatFullPrice(property.price)} in ${property.locality}, ${capitalize(property.city)}.`;

  return {
    title,
    description,
    alternates: { canonical: `/properties/${slug}` },
    openGraph: {
      title,
      description,
      images: property.images[0] ? [property.images[0].url] : undefined,
    },
  };
}

export default async function PropertyPage({ params }: Props) {
  const { slug } = await params;
  const property = await getProperty(slug);
  if (!property) notFound();

  const similar = await getSimilarProperties(slug);

  // Structured data that helps search engines understand this page.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: property.title,
    description: property.description || undefined,
    datePosted: property.created_at,
    image: property.images.map((image) => image.url),
    offers: { '@type': 'Offer', price: property.price, priceCurrency: 'INR' },
  };

  const [mainImage, ...otherImages] = property.images;
  const bedrooms = formatBedrooms(property.bedrooms, property.type);

  return (
    <main className="mx-auto w-full max-w-6xl p-4">
      <script
        type="application/ld+json"
        // Escaping < stops a title containing </script> from running as code.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />

      <nav aria-label="Breadcrumb" className="mb-4 text-sm capitalize text-gray-600">
        <Link href="/" className="hover:text-gray-950 hover:underline">Home</Link>
        {' / '}
        <Link href={`/?city=${encodeURIComponent(property.city)}`} className="hover:text-gray-950 hover:underline">{property.city}</Link>
        {' / '}
        {property.locality}
      </nav>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="relative aspect-video overflow-hidden rounded-3xl bg-gray-100">
            {mainImage ? (
              <Image
                src={mainImage.url}
                alt={property.title}
                fill
                preload
                sizes="(min-width: 1024px) 66vw, 100vw"
                className="object-cover"
              />
            ) : (
              <SamplePhoto id={property.id} type={property.type} sizes="(min-width: 1024px) 66vw, 100vw" />
            )}
          </div>

          {otherImages.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-3">
              {otherImages.map((image) => (
                <div key={image.id} className="relative aspect-video overflow-hidden rounded-2xl bg-gray-100">
                  <Image src={image.url} alt={property.title} fill sizes="(min-width: 1024px) 22vw, 33vw" className="object-cover" />
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 rounded-3xl bg-gray-100 p-6">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-3xl font-light text-gray-950">{property.title}</h1>
              <EditListingLink propertyId={property.id} ownerId={property.owner_id} />
            </div>
            <p className="mt-1 capitalize text-gray-700">{property.locality}, {property.city}</p>
            <p className="mt-3 text-4xl font-semibold text-gray-950">{formatPrice(property.price)}</p>
            <p className="text-sm text-gray-600">{formatFullPrice(property.price)}</p>

            <div className="mt-4 flex flex-wrap gap-2 text-sm font-medium capitalize text-gray-900">
              <span className="rounded-full bg-white px-3 py-1">{property.type}</span>
              {bedrooms && <span className="rounded-full bg-white px-3 py-1">{bedrooms}</span>}
              <span className="rounded-full bg-white px-3 py-1">Posted {formatDate(property.created_at)}</span>
            </div>
          </div>

          {property.description && (
            <section className="mt-4 rounded-3xl bg-gray-100 p-6">
              <h2 className="mb-2 text-lg font-semibold text-gray-900">About this property</h2>
              <p className="whitespace-pre-line text-gray-800">{property.description}</p>
            </section>
          )}
        </div>

        <InquiryForm propertyId={property.id} ownerId={property.owner_id} />
      </div>

      {similar.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-3xl font-light text-gray-950">Similar properties</h2>
          <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((item) => (
              <PropertyCard key={item.id} property={item} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
