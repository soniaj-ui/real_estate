'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { accentButton } from '@/lib/styles';

const linkClass = 'nav-link text-sm font-medium text-gray-700 hover:underline';

export function Header() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push('/');
  }

  return (
    <header className="site-header sticky top-0 z-20 border-b border-gray-200 bg-white">
      <nav className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-4">
        <Link href="/" className="nav-link mr-auto text-xl font-semibold tracking-tight text-gray-950">
          HomeFinder
        </Link>

        {/* Nothing shows until we know the login state, so the links don't flicker. */}
        {!loading && user && (
          <>
            <Link href="/my-listings" className={linkClass}>My listings</Link>
            <Link href="/inquiries" className={linkClass}>Inquiries</Link>
            <button onClick={handleLogout} className={linkClass}>Log out</button>
            <Link href="/listings/new" className={accentButton}>Post a listing</Link>
          </>
        )}
        {!loading && !user && (
          <>
            <Link href="/login" className={linkClass}>Log in</Link>
            <Link href="/register" className={accentButton}>Sign up</Link>
          </>
        )}
      </nav>
    </header>
  );
}
