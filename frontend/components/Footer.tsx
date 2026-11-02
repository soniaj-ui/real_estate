import Link from 'next/link';

const COLUMNS = [
  {
    title: 'Explore',
    links: [
      { label: 'All properties', href: '/?sort=newest' },
      { label: 'Lowest prices', href: '/?sort=price_asc' },
      { label: 'Post a listing', href: '/listings/new' },
    ],
  },
  {
    title: 'Cities',
    links: [
      { label: 'Mumbai', href: '/?city=mumbai' },
      { label: 'Pune', href: '/?city=pune' },
      { label: 'Bengaluru', href: '/?city=bengaluru' },
      { label: 'Delhi', href: '/?city=delhi' },
    ],
  },
  {
    title: 'Property types',
    links: [
      { label: 'Apartments', href: '/?type=apartment' },
      { label: 'Villas', href: '/?type=villa' },
      { label: 'Plots', href: '/?type=plot' },
      { label: 'Commercial', href: '/?type=commercial' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-auto bg-gray-950 pb-8 pt-12 text-sm text-gray-300">
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2">
            <Link href="/" className="text-3xl font-light tracking-tight text-white">HomeFinder</Link>
            <p className="mt-3 max-w-xs leading-relaxed">
              Search apartments, villas, plots and commercial property by city, budget and bedrooms.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="mb-3 font-semibold text-lime-300">{column.title}</h2>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="hover:text-white hover:underline">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 border-t border-gray-800 pt-6 text-gray-400">
          <p>
            A demonstration project. The listings and sample photos are test data. Photos from{' '}
            <a href="https://unsplash.com/license" className="underline hover:text-white">Unsplash</a>.
          </p>
        </div>
      </div>
    </footer>
  );
}
