import Image from 'next/image';
import Link from 'next/link';
import { accentButton, primaryButton } from '@/lib/styles';

// True facts about the seed data, rather than made-up marketing numbers.
const FACTS = [
  { value: '50,000+', label: 'Sample listings' },
  { value: '40', label: 'Localities' },
  { value: '4', label: 'Cities' },
  { value: '4', label: 'Property types' },
];

const STEPS = [
  { title: 'Search', text: 'Filter by city, locality, budget, type and bedrooms.' },
  { title: 'Compare', text: 'Open a listing to see its details and similar properties.' },
  { title: 'Contact', text: 'Log in and send the owner a message from the listing page.' },
];

const QUESTIONS = [
  { question: 'What types of property can I find?', answer: 'Apartments, villas, plots and commercial property.' },
  { question: 'How do I contact an owner?', answer: 'Log in, open the listing and send a message. The owner sees your name and email with it.' },
  { question: 'How do I post a listing?', answer: 'Create an account, choose Post a listing, fill in the details, then add up to 10 photos.' },
  { question: 'Can I hide a listing without deleting it?', answer: 'Yes. Edit the listing and change its visibility to inactive.' },
  { question: 'Are these listings real?', answer: 'No. This is a demonstration project, and the listings and sample photos are test data.' },
];

const SECTION = 'mx-auto w-full max-w-6xl px-4 py-10 md:py-14';

// Shown above the listings on the first visit.
export function LandingTop() {
  return (
    <>
      <section className={SECTION}>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 className="max-w-xl text-4xl font-light leading-tight text-gray-950">Your next home might be one search away.</h2>
          <p className="max-w-xs text-sm leading-relaxed text-gray-700">
            Every listing shows its price, location and type, so you can compare properties quickly.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl md:col-span-2 md:aspect-auto">
            <Image src="/samples/villa-4.jpg" alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
          </div>
          <div className="rounded-3xl bg-gray-100 p-6 md:min-h-72">
            <h3 className="text-2xl font-light text-gray-950">Start with your budget</h3>
            <p className="mt-3 text-sm leading-relaxed text-gray-700">Set a minimum and maximum price, then sort from low to high to see what fits.</p>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl md:aspect-auto">
            <Image src="/samples/villa-7.jpg" alt="" fill sizes="(min-width: 768px) 25vw, 100vw" className="object-cover" />
          </div>
        </div>

        <dl className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-4">
          {FACTS.map((fact) => (
            <div key={fact.label}>
              <dd className="text-4xl font-medium text-gray-950">{fact.value}</dd>
              <dt className="mt-1 text-sm text-gray-600">{fact.label}</dt>
            </div>
          ))}
        </dl>
      </section>

      <section className="bg-gray-100">
        <div className={`${SECTION} grid items-center gap-8 md:grid-cols-2`}>
          <div className="relative aspect-video overflow-hidden rounded-3xl">
            <Image src="/samples/villa-2.jpg" alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
          </div>
          <div>
            <h2 className="text-4xl font-light leading-tight text-gray-950">Discover properties with the best value</h2>
            <p className="mb-6 mt-3 text-sm leading-relaxed text-gray-700">See every listing sorted from the lowest price up, then narrow it down to your city.</p>
            <Link href="/?sort=price_asc" className={primaryButton}>
              See lowest prices <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

// Shown below the listings on the first visit.
export function LandingBottom() {
  return (
    <>
      <section className={`${SECTION} grid gap-8 md:grid-cols-3`}>
        <h2 className="text-4xl font-light leading-tight text-gray-950">Frequently asked questions</h2>
        <div className="divide-y divide-gray-200 md:col-span-2">
          {/* details is built into HTML: it opens and closes with no JavaScript. */}
          {QUESTIONS.map((item) => (
            <details key={item.question} className="py-4">
              <summary className="cursor-pointer font-semibold text-gray-950">{item.question}</summary>
              <p className="mt-2 text-sm leading-relaxed text-gray-700">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="bg-gray-100">
        <div className={SECTION}>
          <h2 className="mb-8 text-4xl font-light text-gray-950">How it works</h2>
          <ol className="grid gap-4 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="rounded-3xl bg-white p-6">
                <p className="flex h-10 w-10 items-center justify-center rounded-full bg-lime-300 font-semibold text-gray-950">{index + 1}</p>
                <h3 className="mt-4 text-xl font-semibold text-gray-950">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-700">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className={SECTION}>
        <div className="relative isolate overflow-hidden rounded-3xl bg-gray-900 px-6 py-16 text-center md:py-24">
          <Image src="/samples/villa-6.jpg" alt="" fill sizes="(min-width: 1152px) 1152px, 100vw" className="-z-10 object-cover" />
          <div className="absolute inset-0 -z-10 bg-black/50" />
          <h2 className="mx-auto mb-6 max-w-xl text-4xl font-light leading-tight text-white md:text-5xl">Have a property to sell?</h2>
          <Link href="/listings/new" className={accentButton}>
            Post a listing <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </>
  );
}
