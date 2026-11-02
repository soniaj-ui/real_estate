'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { apiFetch, endSession, restoreSession, sendJson, startSession } from './client';
import type { User } from './types';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

type AuthResponse = { user: User; accessToken: string };

const AuthContext = createContext<AuthContextValue | null>(null);

// Wraps the whole site, so every component can ask who is logged in.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // A page reload clears the token from memory, so ask for a new one using the cookie.
  useEffect(() => {
    restoreSession()
      .then(async (restored) => {
        if (!restored) return;
        const data = await apiFetch<{ user: User }>('/auth/me');
        setUser(data.user);
      })
      .catch(() => endSession())
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const data = await sendJson<AuthResponse>('/auth/login', 'POST', { email, password });
    startSession(data.accessToken);
    setUser(data.user);
  }

  async function register(name: string, email: string, password: string) {
    const data = await sendJson<AuthResponse>('/auth/register', 'POST', { name, email, password });
    startSession(data.accessToken);
    setUser(data.user);
  }

  async function logout() {
    await apiFetch('/auth/logout', { method: 'POST' }).catch(() => undefined);
    endSession();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
