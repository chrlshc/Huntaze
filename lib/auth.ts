// Authentication configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// OAuth URLs - Now handled by the backend
export const getOAuthUrl = (provider: 'google') => {
  switch (provider) {
    case 'google':
      return `${API_URL}/api/auth/google`;
    
    default:
      throw new Error('Invalid provider');
  }
};

// Stub getServerSession for build-time API routes that expect it.
// Replace with a real session lookup (e.g., reading cookies/JWT) when backend is ready.
export async function getServerSession(): Promise<{ user?: { id: string; email: string } } | null> {
  return null;
}
