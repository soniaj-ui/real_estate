import Form from 'next/form';
import Image from 'next/image';
import Link from 'next/link';
import { inputClass, labelClass, primaryButton } from '@/lib/styles';

const TYPES = ['apartment', 'villa', 'plot', 'commercial'];
const CITIES = ['Mumbai', 'Pune', 'Bengaluru', 'Delhi'];

const fieldClass = `${inputClass} mt-1`;

type Props = {
  // Gets a value from the URL, to fill in the form.
  text: (name: string) => string;
  // The first visit gets the large heading. A search keeps it small, so results stay high up.
  landing: boolean;
};

export function SearchHero({ text, landing }: Props) {
  return (
    // The hero class also makes the header float over this photo. See globals.css.
    <section className="hero relative isolate overflow-hidden bg-gray-900">
      <Image src="/samples/hero.jpg" alt="" fill preload sizes="100vw" className="-z-10 object-cover" />
      {/* Darkens the photo, so the white text stays easy to read. */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/60 via-black/10 to-black/40" />

      <div className={`mx-auto w-full max-w-6xl px-4 pb-8 ${landing ? 'pt-32 md:pt-80' : 'pt-28'}`}>
        {landing && (
          <div className="mb-4 flex flex-wrap gap-2">
            {TYPES.map((type) => (
              <Link key={type} href={`/?type=${type}`} className="rounded-full bg-white px-4 py-1.5 text-sm font-medium capitalize text-gray-900 hover:bg-lime-300">
                {type}
              </Link>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-end justify-between gap-6">
          <h1 className={`font-light tracking-tight text-white drop-shadow-lg ${landing ? 'max-w-2xl text-5xl leading-tight md:text-7xl' : 'text-4xl'}`}>
            Find your next home
          </h1>
          {landing && (
            <p className="max-w-xs text-sm leading-relaxed text-white drop-shadow-lg">
              Search apartments, villas, plots and commercial property by city, budget and bedrooms.
            </p>
          )}
        </div>

        <div className="mt-8 rounded-3xl bg-white p-5 shadow-xl md:p-7">
          <h2 className="mb-4 text-xl font-semibold text-gray-950">Find the best place</h2>

          {/* next/form updates the URL without a full page reload. */}
          <Form action="/" className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <label className={labelClass}>
              City
              <input name="city" placeholder="Any city" defaultValue={text('city')} className={fieldClass} />
            </label>
            <label className={labelClass}>
              Locality
              <input name="locality" placeholder="Any locality" defaultValue={text('locality')} className={fieldClass} />
            </label>
            <label className={labelClass}>
              Looking for
              <select name="type" defaultValue={text('type')} className={fieldClass}>
                <option value="">Any type</option>
                <option value="apartment">Apartment</option>
                <option value="villa">Villa</option>
                <option value="plot">Plot</option>
                <option value="commercial">Commercial</option>
              </select>
            </label>
            <label className={labelClass}>
              Bedrooms
              <input name="bedrooms" type="number" min="0" placeholder="Any" defaultValue={text('bedrooms')} className={fieldClass} />
            </label>
            <label className={labelClass}>
              Min price
              <input name="minPrice" type="number" min="0" placeholder="₹" defaultValue={text('minPrice')} className={fieldClass} />
            </label>
            <label className={labelClass}>
              Max price
              <input name="maxPrice" type="number" min="0" placeholder="₹" defaultValue={text('maxPrice')} className={fieldClass} />
            </label>
            <label className={`${labelClass} col-span-2 md:col-span-1`}>
              Sort by
              <select name="sort" defaultValue={text('sort')} className={fieldClass}>
                <option value="newest">Newest first</option>
                <option value="price_asc">Price: low to high</option>
                <option value="price_desc">Price: high to low</option>
              </select>
            </label>
            <button className={`${primaryButton} col-span-2 self-end md:col-span-1`}>Search properties</button>
          </Form>

          <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold text-gray-900">Popular:</span>
            {CITIES.map((city) => (
              <Link key={city} href={`/?city=${city.toLowerCase()}`} className="rounded-full border border-gray-300 px-4 py-1.5 font-medium text-gray-800 hover:bg-gray-100">
                {city}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
