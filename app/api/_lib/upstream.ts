import { cookies } from 'next/headers';

const DEFAULT_UPSTREAM = process.env.API_ORIGIN || process.env.NEXT_PUBLIC_API_URL || '';

function joinPath(base: string, path: string) {
  const b = base.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${b}${p}`;
}

export async function upstream(path: string, init: RequestInit = {}) {
  if (!DEFAULT_UPSTREAM) {
    throw new Error('API_ORIGIN (or NEXT_PUBLIC_API_URL) not configured');
  }

  const token = cookies().get('access_token')?.value || '';
  const headers = new Headers(init.headers);
  headers.set('accept', 'application/json');
  if (!headers.has('content-type')) headers.set('content-type', 'application/json');
  if (token && !headers.has('authorization')) headers.set('authorization', `Bearer ${token}`);

  return fetch(joinPath(DEFAULT_UPSTREAM, path), {
    ...init,
    headers,
    cache: 'no-store',
  });
}

