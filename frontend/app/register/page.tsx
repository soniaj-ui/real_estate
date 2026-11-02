import type { Metadata } from 'next';
import { AuthForm } from '@/components/AuthForm';
import { safeNextPath } from '@/lib/safe-path';

export const metadata: Metadata = {
  title: 'Sign up',
  robots: { index: false },
};

type Props = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function RegisterPage({ searchParams }: Props) {
  const { next } = await searchParams;
  return <AuthForm mode="register" next={safeNextPath(next)} />;
}
