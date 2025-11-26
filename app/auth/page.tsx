import { redirect } from 'next/navigation';

// Force dynamic rendering - this page uses NextAuth session
export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;

export default function AuthPage({ searchParams = {} }: { searchParams?: SearchParams }) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === 'string') {
      params.set(key, value);
    } else if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, v));
    }
  }

  const qs = params.toString();
  const target = `/auth/register${qs ? `?${qs}` : ''}`;

  redirect(target);
}
