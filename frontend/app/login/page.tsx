import type { Metadata } from 'next';
import { AuthForm } from '@/components/AuthForm';
import { safeNextPath } from '@/lib/safe-path';

export const metadata: Metadata = {
  title: 'Log in',
  robots: { index: false },
};

type Props = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const { next } = await searchParams;
  return <AuthForm mode="login" next={safeNextPath(next)} />;
}
