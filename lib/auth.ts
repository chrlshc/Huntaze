// Authentication configuration: call our internal API route handlers
const API_BASE = '/api';

// OAuth URLs - Now handled by the backend
export const getOAuthUrl = (provider: 'google') => {
  switch (provider) {
    case 'google':
      return `${API_BASE}/auth/google`;
    
    default:
      throw new Error('Invalid provider');
  }
};

// Stub getServerSession for build-time API routes that expect it.
// Replace with a real session lookup (e.g., reading cookies/JWT) when backend is ready.
import { getCurrentUser } from '@/lib/auth/jwt';

export async function getServerSession(): Promise<{ user?: { id: string; email: string } } | null> {
  try {
    const user = await getCurrentUser();
    if (!user) return null;
    return { user: { id: user.userId, email: user.email } };
  } catch {
    return null;
  }
}
