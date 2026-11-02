'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { FormError } from '@/components/FormError';
import { useAuth } from '@/lib/auth';
import { inputClass, labelClass, primaryButton } from '@/lib/styles';

type Props = {
  mode: 'login' | 'register';
  next: string;
};

export function AuthForm({ mode, next }: Props) {
  const { login, register } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<unknown>(null);
  const [submitting, setSubmitting] = useState(false);
  const isLogin = mode === 'login';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email'));
    const password = String(form.get('password'));

    setSubmitting(true);
    setError(null);
    try {
      if (isLogin) await login(email, password);
      else await register(String(form.get('name')), email, password);
      router.push(next);
    } catch (err) {
      setError(err);
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto my-8 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
      <h1 className="mb-4 text-2xl font-bold text-gray-900">{isLogin ? 'Log in' : 'Create an account'}</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <div>
            <label htmlFor="name" className={labelClass}>Name</label>
            <input id="name" name="name" required maxLength={100} autoComplete="name" className={inputClass} />
          </div>
        )}
        <div>
          <label htmlFor="email" className={labelClass}>Email</label>
          <input id="email" name="email" type="email" required autoComplete="email" className={inputClass} />
        </div>
        <div>
          <label htmlFor="password" className={labelClass}>Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={isLogin ? 1 : 8}
            maxLength={72}
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            className={inputClass}
          />
          {!isLogin && <p className="mt-1 text-xs text-gray-600">At least 8 characters.</p>}
        </div>

        <FormError error={error} />

        <button disabled={submitting} className={`${primaryButton} w-full`}>
          {submitting ? 'Please wait...' : isLogin ? 'Log in' : 'Sign up'}
        </button>
      </form>

      <p className="mt-4 text-sm text-gray-700">
        {isLogin ? 'New here? ' : 'Already have an account? '}
        <Link
          href={`${isLogin ? '/register' : '/login'}?next=${encodeURIComponent(next)}`}
          className="font-medium text-emerald-800 hover:underline"
        >
          {isLogin ? 'Create an account' : 'Log in'}
        </Link>
      </p>
    </main>
  );
}
