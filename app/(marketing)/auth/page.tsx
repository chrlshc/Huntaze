import AuthClient from './auth-client';

// Force dynamic rendering - this page uses NextAuth session
// Enable static generation for optimal performance and SEO
export const dynamic = 'force-static';

export default function AuthPage() {
  return <AuthClient />;
}
