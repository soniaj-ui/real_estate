import Link from 'next/link';
import { primaryButton } from '@/lib/styles';

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-6xl p-4">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Page not found</h1>
      <p className="mb-4 text-gray-700">This page or listing doesn&apos;t exist, or it may have been removed.</p>
      <Link href="/" className={primaryButton}>Search properties</Link>
    </main>
  );
}
