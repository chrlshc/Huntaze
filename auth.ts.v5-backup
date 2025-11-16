/**
 * Auth.js v5 Configuration
 * 
 * Centralized authentication configuration for NextAuth v5 (Auth.js)
 * Compatible with Next.js 16
 */

import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import type { NextAuthConfig } from 'next-auth';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Authenticate user with credentials
 */
async function authenticateUser(
  email: string,
  password: string
): Promise<{ id: string; email: string; name?: string; role?: string; creatorId?: string } | null> {
  const maxRetries = 3;
  let lastError: Error | null = null;

  console.log('[Auth] Authentication attempt:', { email });

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { query } = await import('@/lib/db');
      const { compare } = await import('bcryptjs');

      // Find user by email
      const result = await query(
        `SELECT id, email, name, password, role, creator_id 
         FROM users 
         WHERE LOWER(email) = LOWER($1)`,
        [email]
      );

      if (result.rows.length === 0) {
        throw new Error('Invalid credentials');
      }

      const user = result.rows[0];

      if (!user.password) {
        throw new Error('Invalid credentials');
      }

      // Verify password
      const isValidPassword = await compare(password, user.password);
      
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      console.log('[Auth] Authentication successful:', { userId: user.id, email: user.email });

      return {
        id: user.id.toString(),
        email: user.email,
        name: user.name,
        role: user.role || 'creator',
        creatorId: user.creator_id?.toString() || undefined,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      console.error(`[Auth] Authentication attempt ${attempt}/${maxRetries} failed:`, lastError.message);

      // Don't retry on validation errors
      if (lastError.message.includes('Invalid credentials')) {
        break;
      }

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.min(100 * Math.pow(2, attempt - 1), 1000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  console.error('[Auth] Authentication failed after retries:', { email, error: lastError?.message });
  return null;
}

// ============================================================================
// Auth.js Configuration
// ============================================================================

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return null;
        }

        // Password length validation
        if (password.length < 8) {
          return null;
        }

        const user = await authenticateUser(email, password);
        return user;
      },
    }),
  ],
  pages: {
    signIn: '/auth',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.creatorId = (user as any).creatorId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).creatorId = token.creatorId;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
