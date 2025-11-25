import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface VerifyEmailPageProps {
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const tokenParam = searchParams?.token;
  const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam;

  if (!token) {
    redirect('/auth?verified=false&error=missing_token');
  }

  // Delegate verification to the existing API route
  const userId = Array.isArray(searchParams?.userId)
    ? searchParams?.userId[0]
    : searchParams?.userId;

  // Redirect to client verifier page that handles POST with token+userId
  redirect(`/auth/verify?token=${encodeURIComponent(token as string)}${userId ? `&userId=${encodeURIComponent(userId)}` : ''}`);
}
