import AuthClient from './auth-client';

// Force dynamic rendering - this page uses NextAuth session
export const dynamic = 'force-dynamic';

export default function AuthPage() {
  return <AuthClient />;
}
