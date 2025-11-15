/**
 * NextAuth Configuration - Authentication API Routes
 * 
 * Handles authentication flows with comprehensive error handling,
 * retry logic, and security best practices.
 * 
 * @endpoints
 * - GET  /api/auth/[...nextauth] - NextAuth session/provider endpoints
 * - POST /api/auth/[...nextauth] - Authentication actions
 * 
 * @security
 * - JWT-based sessions with secure token rotation
 * - Rate limiting via middleware
 * - CSRF protection enabled
 * - Secure cookie settings
 */

import NextAuth, { NextAuthOptions, User, Account, Profile } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import type { Session } from 'next-auth';

// ============================================================================
// Types
// ============================================================================

interface ExtendedUser extends User {
  id: string;
  email: string;
  name?: string | null;
  role?: string;
  creatorId?: string;
}

interface ExtendedToken extends JWT {
  id?: string;
  role?: string;
  creatorId?: string;
  error?: string;
}

interface ExtendedSession extends Session {
  user: {
    id: string;
    email: string;
    name?: string | null;
    role?: string;
    creatorId?: string;
  };
  error?: string;
}

// ============================================================================
// Configuration Validation
// ============================================================================

const validateConfig = () => {
  const errors: string[] = [];

  if (!process.env.NEXTAUTH_SECRET) {
    errors.push('NEXTAUTH_SECRET is required');
  }

  if (!process.env.NEXTAUTH_URL) {
    console.warn('[NextAuth] NEXTAUTH_URL not set, using default');
  }

  // Google OAuth validation (optional)
  if (process.env.GOOGLE_CLIENT_ID && !process.env.GOOGLE_CLIENT_SECRET) {
    errors.push('GOOGLE_CLIENT_SECRET required when GOOGLE_CLIENT_ID is set');
  }

  if (errors.length > 0) {
    console.error('[NextAuth] Configuration errors:', errors);
    throw new Error(`NextAuth configuration invalid: ${errors.join(', ')}`);
  }
};

// Validate on module load
validateConfig();

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate correlation ID for request tracing
 */
const generateCorrelationId = (): string => {
  return `auth-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

/**
 * Authenticate user with credentials
 * Implements retry logic and comprehensive error handling
 */
async function authenticateUser(
  email: string,
  password: string
): Promise<ExtendedUser | null> {
  const correlationId = generateCorrelationId();
  const maxRetries = 3;
  let lastError: Error | null = null;

  console.log('[NextAuth] Authentication attempt:', {
    email,
    correlationId,
    timestamp: new Date().toISOString(),
  });

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

      const authenticatedUser: ExtendedUser = {
        id: user.id.toString(),
        email: user.email,
        name: user.name,
        role: user.role || 'creator',
        creatorId: user.creator_id?.toString() || undefined,
      };

      console.log('[NextAuth] Authentication successful:', {
        userId: authenticatedUser.id,
        email: authenticatedUser.email,
        correlationId,
      });

      return authenticatedUser;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      console.error(`[NextAuth] Authentication attempt ${attempt}/${maxRetries} failed:`, {
        error: lastError.message,
        correlationId,
      });

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

  console.error('[NextAuth] Authentication failed after retries:', {
    email,
    error: lastError?.message,
    correlationId,
  });

  return null;
}

/**
 * Validate OAuth account
 */
function validateOAuthAccount(
  account: Account | null,
  profile: Profile | undefined
): boolean {
  if (!account || !profile) {
    return false;
  }

  // Validate required fields
  if (!account.provider || !account.providerAccountId) {
    console.error('[NextAuth] Invalid OAuth account:', {
      provider: account.provider,
      hasProviderAccountId: !!account.providerAccountId,
    });
    return false;
  }

  return true;
}

// ============================================================================
// NextAuth Configuration
// ============================================================================

export const authOptions: NextAuthOptions = {
  // Providers
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { 
          label: 'Email', 
          type: 'email',
          placeholder: 'your@email.com'
        },
        password: { 
          label: 'Password', 
          type: 'password',
          placeholder: '••••••••'
        },
      },
      async authorize(credentials) {
        try {
          // Validation
          if (!credentials?.email || !credentials?.password) {
            console.warn('[NextAuth] Missing credentials');
            return null;
          }

          // Email format validation
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(credentials.email)) {
            console.warn('[NextAuth] Invalid email format:', credentials.email);
            return null;
          }

          // Password length validation
          if (credentials.password.length < 8) {
            console.warn('[NextAuth] Password too short');
            return null;
          }

          // Authenticate
          const user = await authenticateUser(
            credentials.email,
            credentials.password
          );

          return user;
        } catch (error) {
          console.error('[NextAuth] Authorization error:', error);
          return null;
        }
      },
    }),

    // Google OAuth Provider (conditional)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: {
              params: {
                prompt: 'consent',
                access_type: 'offline',
                response_type: 'code',
              },
            },
          }),
        ]
      : []),
  ],

  // Custom pages
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
    newUser: '/onboarding',
  },

  // Callbacks
  callbacks: {
    /**
     * JWT callback - runs when JWT is created or updated
     */
    async jwt({ token, user, account, profile, trigger }): Promise<ExtendedToken> {
      try {
        // Initial sign in
        if (user) {
          const extendedUser = user as ExtendedUser;
          token.id = extendedUser.id;
          token.email = extendedUser.email;
          token.name = extendedUser.name;
          token.role = extendedUser.role;
          token.creatorId = extendedUser.creatorId;

          console.log('[NextAuth] JWT created:', {
            userId: token.id,
            email: token.email,
            trigger,
          });
        }

        // OAuth sign in
        if (account && profile) {
          if (!validateOAuthAccount(account, profile)) {
            token.error = 'OAuthAccountNotLinked';
            return token;
          }

          console.log('[NextAuth] OAuth JWT created:', {
            provider: account.provider,
            userId: token.id,
          });
        }

        // Token refresh
        if (trigger === 'update') {
          console.log('[NextAuth] JWT updated:', {
            userId: token.id,
          });
        }

        return token;
      } catch (error) {
        console.error('[NextAuth] JWT callback error:', error);
        return { ...token, error: 'JWTError' };
      }
    },

    /**
     * Session callback - runs when session is checked
     */
    async session({ session, token }): Promise<ExtendedSession> {
      try {
        const extendedToken = token as ExtendedToken;
        const extendedSession = session as ExtendedSession;

        // Add user data to session
        if (extendedSession.user && extendedToken.id) {
          extendedSession.user.id = extendedToken.id;
          extendedSession.user.role = extendedToken.role;
          extendedSession.user.creatorId = extendedToken.creatorId;
        }

        // Pass through errors
        if (extendedToken.error) {
          extendedSession.error = extendedToken.error;
        }

        return extendedSession;
      } catch (error) {
        console.error('[NextAuth] Session callback error:', error);
        return session as ExtendedSession;
      }
    },

    /**
     * Sign in callback - control if user is allowed to sign in
     */
    async signIn({ user, account, profile }) {
      try {
        // OAuth validation
        if (account?.provider === 'google') {
          if (!validateOAuthAccount(account, profile)) {
            console.error('[NextAuth] OAuth validation failed');
            return false;
          }

          // Check if email is verified (Google)
          if (profile && 'email_verified' in profile && !profile.email_verified) {
            console.warn('[NextAuth] Email not verified:', profile.email);
            return false;
          }
        }

        console.log('[NextAuth] Sign in allowed:', {
          userId: user.id,
          provider: account?.provider || 'credentials',
        });

        return true;
      } catch (error) {
        console.error('[NextAuth] Sign in callback error:', error);
        return false;
      }
    },

    /**
     * Redirect callback - control where user is redirected after auth
     */
    async redirect({ url, baseUrl }) {
      try {
        // Allows relative callback URLs
        if (url.startsWith('/')) {
          return `${baseUrl}${url}`;
        }
        // Allows callback URLs on the same origin
        else if (new URL(url).origin === baseUrl) {
          return url;
        }
        return baseUrl;
      } catch (error) {
        console.error('[NextAuth] Redirect callback error:', error);
        return baseUrl;
      }
    },
  },

  // Session configuration
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },

  // JWT configuration
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // Security
  secret: process.env.NEXTAUTH_SECRET,
  
  // Cookies
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },

  // Events for logging
  events: {
    async signIn({ user, account, isNewUser }) {
      console.log('[NextAuth] User signed in:', {
        userId: user.id,
        email: user.email,
        provider: account?.provider,
        isNewUser,
        timestamp: new Date().toISOString(),
      });
    },
    async signOut({ token }) {
      console.log('[NextAuth] User signed out:', {
        userId: (token as ExtendedToken).id,
        timestamp: new Date().toISOString(),
      });
    },
    async createUser({ user }) {
      console.log('[NextAuth] User created:', {
        userId: user.id,
        email: user.email,
        timestamp: new Date().toISOString(),
      });
    },
    async linkAccount({ user, account }) {
      console.log('[NextAuth] Account linked:', {
        userId: user.id,
        provider: account.provider,
        timestamp: new Date().toISOString(),
      });
    },
  },

  // Debug mode (only in development)
  debug: process.env.NODE_ENV === 'development',
};

// ============================================================================
// Route Handlers
// ============================================================================

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

// ============================================================================
// Export types for use in other files
// ============================================================================

export type { ExtendedUser, ExtendedToken, ExtendedSession };
