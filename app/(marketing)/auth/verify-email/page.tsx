import { redirect } from 'next/navigation';

// Enable static generation for optimal performance and SEO
export const dynamic = 'force-static';

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
  redirect(`/api/auth/verify-email?token=${encodeURIComponent(token as string)}`);
}
