import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface VerifyEmailPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const resolvedParams = await searchParams;
  const tokenParam = resolvedParams?.token;
  const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam;

  if (!token) {
    redirect('/auth?verified=false&error=missing_token');
  }

  // Delegate verification to the existing API route
  const userId = Array.isArray(resolvedParams?.userId)
    ? resolvedParams?.userId[0]
    : resolvedParams?.userId;

  // Redirect to client verifier page that handles POST with token+userId
  redirect(`/auth/verify?token=${encodeURIComponent(token as string)}${userId ? `&userId=${encodeURIComponent(userId)}` : ''}`);
}
