// This file runs in the browser. It adds the login token to requests and renews it when needed.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

// A marker, not a secret. It only avoids a pointless refresh call for logged-out visitors.
const SESSION_FLAG = 'hasSession';

// Kept in memory and not in localStorage, so a malicious script can't simply read it.
let accessToken: string | null = null;
let refreshInProgress: Promise<boolean> | null = null;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details: { path: (string | number)[]; message: string }[] = [],
  ) {
    super(message);
  }
}

export function startSession(token: string) {
  accessToken = token;
  localStorage.setItem(SESSION_FLAG, 'true');
}

export function endSession() {
  accessToken = null;
  localStorage.removeItem(SESSION_FLAG);
}

async function requestNewToken(): Promise<boolean> {
  const res = await fetch(`${API_URL}/auth/refresh`, { method: 'POST', credentials: 'include' });
  if (!res.ok) {
    endSession();
    return false;
  }
  const data = await res.json();
  startSession(data.accessToken);
  return true;
}

// A refresh token only works once, so the browser's lock makes other tabs wait their turn.
async function requestWithLock(): Promise<boolean> {
  if (navigator.locks) return navigator.locks.request('refresh-token', requestNewToken);
  return requestNewToken();
}

// Calls made at the same time in this tab all share one request.
function refreshToken(): Promise<boolean> {
  if (!refreshInProgress) {
    refreshInProgress = requestWithLock().finally(() => {
      refreshInProgress = null;
    });
  }
  return refreshInProgress;
}

export function restoreSession(): Promise<boolean> {
  if (!localStorage.getItem(SESSION_FLAG)) return Promise.resolve(false);
  return refreshToken();
}

async function send(path: string, options: RequestInit): Promise<Response> {
  const headers = new Headers(options.headers);
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  return fetch(API_URL + path, { ...options, headers, credentials: 'include' });
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res = await send(path, options);

  // The token lasts 15 minutes. If it expired, renew it and try once more.
  if (res.status === 401 && accessToken && (await refreshToken())) {
    res = await send(path, options);
  }

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(res.status, data?.error ?? 'Something went wrong', data?.details);
  }
  return data;
}

export function sendJson<T>(path: string, method: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}
