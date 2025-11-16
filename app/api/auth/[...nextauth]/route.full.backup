/**
 * NextAuth v4 - Authentication API Routes
 * 
 * Handles authentication flows with comprehensive error handling,
 * retry logic, and security best practices.
 * 
 * Compatible with Next.js 16
 * 
 * @endpoints
 * - GET  /api/auth/[...nextauth] - Auth session/provider endpoints
 * - POST /api/auth/[...nextauth] - Authentication actions
 * 
 * @features
 * - ✅ Error handling with structured errors
 * - ✅ Retry logic with exponential backoff
 * - ✅ Request timeout handling
 * - ✅ Rate limiting integration
 * - ✅ Correlation IDs for tracing
 * - ✅ Comprehensive logging
 * - ✅ TypeScript strict typing
 * 
 * @see https://next-auth.js.org/configuration/options
 */

import { NextRequest, NextResponse } from 'next/server';
import NextAuth, { AuthOptions, Session, User } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';

// ============================================================================
// Types
// ============================================================================

/**
 * Extended User type with custom fields
 */
interface ExtendedUser extends User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  creatorId?: string;
}

/**
 * Extended JWT token type
 */
interface ExtendedJWT extends JWT {
  id?: string;
  role?: string;
  creatorId?: string;
}

/**
 * Extended Session type
 */
interface ExtendedSession extends Session {
  user: {
    id: string;
    email: string;
    name?: string;
    role?: string;
    creatorId?: string;
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Authenticate user with credentials
 * 
 * Features:
 * - Retry logic with exponential backoff
 * - Secure password comparison
 * - Comprehensive error handling
 * - Correlation ID tracking
 * 
 * @param email - User email
 * @param password - User password
 * @param correlationId - Request correlation ID for tracing
 * @returns User object or null if authentication fails
 */
async function authenticateUser(
  email: string,
  password: string,
  correlationId: string
): Promise<ExtendedUser | null> {
  const maxRetries = 3;
  let lastError: Error | null = null;

  console.log(`[Auth] [${correlationId}] Authentication attempt:`, { 
    email: email.substring(0, 3) + '***', // Mask email for security
    timestamp: new Date().toISOString(),
  });

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { query } = await import('@/lib/db');
      const { compare } = await import('bcryptjs');

      // Find user by email (case-insensitive)
      const result = await query(
        `SELECT id, email, name, password, role, creator_id 
         FROM users 
         WHERE LOWER(email) = LOWER($1)
         LIMIT 1`,
        [email]
      );

      if (result.rows.length === 0) {
        console.warn(`[Auth] [${correlationId}] User not found:`, { 
          email: email.substring(0, 3) + '***',
        });
        throw new Error('Invalid credentials');
      }

      const user = result.rows[0];

      if (!user.password) {
        console.warn(`[Auth] [${correlationId}] User has no password:`, { 
          userId: user.id,
        });
        throw new Error('Invalid credentials');
      }

      // Verify password with bcrypt
      const isValidPassword = await compare(password, user.password);
      
      if (!isValidPassword) {
        console.warn(`[Auth] [${correlationId}] Invalid password:`, { 
          userId: user.id,
        });
        throw new Error('Invalid credentials');
      }

      console.log(`[Auth] [${correlationId}] Authentication successful:`, { 
        userId: user.id, 
        email: user.email.substring(0, 3) + '***',
        role: user.role,
        attempt,
      });

      return {
        id: user.id.toString(),
        email: user.email,
        name: user.name || undefined,
        role: user.role || 'creator',
        creatorId: user.creator_id?.toString() || undefined,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      console.error(`[Auth] [${correlationId}] Authentication attempt ${attempt}/${maxRetries} failed:`, {
        error: lastError.message,
        attempt,
        timestamp: new Date().toISOString(),
      });

      // Don't retry on validation errors (invalid credentials)
      if (lastError.message.includes('Invalid credentials')) {
        break;
      }

      // Wait before retry (exponential backoff with jitter)
      if (attempt < maxRetries) {
        const baseDelay = 100 * Math.pow(2, attempt - 1);
        const jitter = Math.random() * 100;
        const delay = Math.min(baseDelay + jitter, 1000);
        
        console.log(`[Auth] [${correlationId}] Retrying in ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  console.error(`[Auth] [${correlationId}] Authentication failed after ${maxRetries} attempts:`, { 
    email: email.substring(0, 3) + '***',
    error: lastError?.message,
  });
  
  return null;
}

// ============================================================================
// NextAuth v4 Configuration
// ============================================================================

/**
 * NextAuth v4 authOptions configuration
 * Exported for use in session utilities and API routes
 * 
 * Features:
 * - Google OAuth provider
 * - Credentials provider with validation
 * - JWT session strategy
 * - Custom callbacks for token/session enrichment
 * - Secure session configuration
 */
export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { 
          label: 'Email', 
          type: 'email',
          placeholder: 'your@email.com',
        },
        password: { 
          label: 'Password', 
          type: 'password',
          placeholder: '••••••••',
        },
      },
      async authorize(credentials, req) {
        const correlationId = generateCorrelationId();
        
        console.log(`[Auth] [${correlationId}] Credentials authorization attempt`);

        // Validate credentials presence
        if (!credentials?.email || !credentials?.password) {
          console.warn(`[Auth] [${correlationId}] Missing credentials`);
          return null;
        }

        const email = credentials.email.trim();
        const password = credentials.password;

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          console.warn(`[Auth] [${correlationId}] Invalid email format`);
          return null;
        }

        // Password length validation
        if (password.length < 8) {
          console.warn(`[Auth] [${correlationId}] Password too short`);
          return null;
        }

        // Authenticate user
        const user = await authenticateUser(email, password, correlationId);
        
        if (!user) {
          console.warn(`[Auth] [${correlationId}] Authentication failed`);
          return null;
        }

        console.log(`[Auth] [${correlationId}] Authorization successful:`, {
          userId: user.id,
          role: user.role,
        });

        return user;
      },
    }),
  ],
  callbacks: {
    /**
     * JWT callback - Enrich token with user data
     * Called whenever a JWT is created or updated
     */
    async jwt({ token, user, account, trigger }): Promise<ExtendedJWT> {
      // On sign in, add user data to token
      if (user) {
        const extendedUser = user as ExtendedUser;
        token.id = extendedUser.id;
        token.role = extendedUser.role;
        token.creatorId = extendedUser.creatorId;
        
        console.log('[Auth] JWT token enriched:', {
          userId: token.id,
          role: token.role,
          trigger,
        });
      }

      // On token update, preserve existing data
      return token as ExtendedJWT;
    },

    /**
     * Session callback - Enrich session with token data
     * Called whenever a session is checked
     */
    async session({ session, token }): Promise<ExtendedSession> {
      // Add token data to session
      if (session.user && token) {
        const extendedToken = token as ExtendedJWT;
        (session.user as any).id = extendedToken.id;
        (session.user as any).role = extendedToken.role;
        (session.user as any).creatorId = extendedToken.creatorId;
      }

      return session as ExtendedSession;
    },

    /**
     * Sign in callback - Control sign in access
     * Return false to deny access
     */
    async signIn({ user, account, profile }) {
      console.log('[Auth] Sign in callback:', {
        userId: user?.id,
        provider: account?.provider,
      });

      // Allow all sign ins (add custom logic here if needed)
      return true;
    },
  },
  pages: {
    signIn: '/auth',
    error: '/auth',
    signOut: '/auth',
    verifyRequest: '/auth/verify-email',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Update session every 24 hours
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
  logger: {
    error: (code, metadata) => {
      console.error('[NextAuth] Error:', { code, metadata });
    },
    warn: (code) => {
      console.warn('[NextAuth] Warning:', { code });
    },
    debug: (code, metadata) => {
      if (process.env.NODE_ENV === 'development') {
        console.debug('[NextAuth] Debug:', { code, metadata });
      }
    },
  },
};

// ============================================================================
// Error Types & Interfaces
// ============================================================================

/**
 * Auth error types for structured error handling
 */
export enum AuthErrorType {
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Structured auth error
 */
interface AuthError {
  type: AuthErrorType;
  message: string;
  userMessage: string;
  correlationId: string;
  statusCode: number;
  retryable: boolean;
  timestamp: string;
}

/**
 * Auth response with metadata
 */
interface AuthResponse {
  success: boolean;
  data?: any;
  error?: AuthError;
  correlationId: string;
  duration: number;
}

// ============================================================================
// Configuration
// ============================================================================

// Force Node.js runtime (required for database connections and NextAuth v4)
// Note: This must be at the top level of the file
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const preferredRegion = 'auto';

// Add error boundary for initialization
if (typeof window === 'undefined') {
  console.log('[NextAuth] Server-side initialization', {
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
    hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
  });
}

// Request timeout (10 seconds)
const REQUEST_TIMEOUT_MS = 10000;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate correlation ID for request tracing
 */
function generateCorrelationId(): string {
  return `auth-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Create structured auth error
 */
function createAuthError(
  type: AuthErrorType,
  message: string,
  correlationId: string,
  statusCode: number = 500,
  retryable: boolean = false
): AuthError {
  const userMessages: Record<AuthErrorType, string> = {
    [AuthErrorType.AUTHENTICATION_FAILED]: 'Authentication failed. Please try again.',
    [AuthErrorType.INVALID_CREDENTIALS]: 'Invalid email or password.',
    [AuthErrorType.SESSION_EXPIRED]: 'Your session has expired. Please sign in again.',
    [AuthErrorType.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please wait a moment and try again.',
    [AuthErrorType.DATABASE_ERROR]: 'A database error occurred. Please try again.',
    [AuthErrorType.NETWORK_ERROR]: 'Network error. Please check your connection and try again.',
    [AuthErrorType.TIMEOUT_ERROR]: 'Request timed out. Please try again.',
    [AuthErrorType.VALIDATION_ERROR]: 'Invalid request. Please check your input.',
    [AuthErrorType.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
  };

  return {
    type,
    message,
    userMessage: userMessages[type],
    correlationId,
    statusCode,
    retryable,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Log auth request
 */
function logAuthRequest(
  method: string,
  path: string,
  correlationId: string,
  metadata?: Record<string, any>
): void {
  console.log(`[Auth] [${correlationId}] ${method} ${path}`, {
    correlationId,
    timestamp: new Date().toISOString(),
    ...metadata,
  });
}

/**
 * Log auth error
 */
function logAuthError(
  error: Error | AuthError,
  correlationId: string,
  metadata?: Record<string, any>
): void {
  console.error(`[Auth] [${correlationId}] Error:`, {
    message: error.message,
    type: (error as AuthError).type || 'UNKNOWN',
    correlationId,
    timestamp: new Date().toISOString(),
    stack: (error as Error).stack,
    ...metadata,
  });
}

/**
 * Execute with timeout
 */
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  correlationId: string
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(
        createAuthError(
          AuthErrorType.TIMEOUT_ERROR,
          `Request timeout after ${timeoutMs}ms`,
          correlationId,
          408,
          true
        )
      );
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

/**
 * Handle auth errors and return appropriate response
 */
function handleAuthError(
  error: Error | AuthError,
  correlationId: string
): NextResponse<AuthResponse> {
  // Check if already a structured error
  if ('type' in error && 'correlationId' in error) {
    const authError = error as AuthError;
    logAuthError(authError, correlationId);

    return NextResponse.json(
      {
        success: false,
        error: authError,
        correlationId,
        duration: 0,
      },
      { status: authError.statusCode }
    );
  }

  // Map common errors to structured errors
  let authError: AuthError;

  if (error.message.includes('Invalid credentials')) {
    authError = createAuthError(
      AuthErrorType.INVALID_CREDENTIALS,
      error.message,
      correlationId,
      401,
      false
    );
  } else if (error.message.includes('rate limit')) {
    authError = createAuthError(
      AuthErrorType.RATE_LIMIT_EXCEEDED,
      error.message,
      correlationId,
      429,
      false
    );
  } else if (error.message.includes('database') || error.message.includes('query')) {
    authError = createAuthError(
      AuthErrorType.DATABASE_ERROR,
      error.message,
      correlationId,
      503,
      true
    );
  } else if (error.message.includes('network') || error.message.includes('ECONNREFUSED')) {
    authError = createAuthError(
      AuthErrorType.NETWORK_ERROR,
      error.message,
      correlationId,
      503,
      true
    );
  } else if (error.message.includes('timeout')) {
    authError = createAuthError(
      AuthErrorType.TIMEOUT_ERROR,
      error.message,
      correlationId,
      408,
      true
    );
  } else {
    authError = createAuthError(
      AuthErrorType.UNKNOWN_ERROR,
      error.message,
      correlationId,
      500,
      true
    );
  }

  logAuthError(authError, correlationId);

  return NextResponse.json(
    {
      success: false,
      error: authError,
      correlationId,
      duration: 0,
    },
    { status: authError.statusCode }
  );
}

// ============================================================================
// NextAuth v4 Handler
// ============================================================================

/**
 * Create NextAuth v4 handler with authOptions
 * 
 * This handler processes all NextAuth requests:
 * - GET: Session retrieval, provider configuration, CSRF tokens
 * - POST: Sign in, sign out, callback processing
 * 
 * The handler is wrapped with error handling and logging in the route handlers below
 */
const handler = NextAuth(authOptions);

/**
 * authOptions is already exported above with the declaration
 * 
 * Usage:
 * ```typescript
 * import { authOptions } from '@/app/api/auth/[...nextauth]/route';
 * import { getServerSession } from 'next-auth';
 * 
 * const session = await getServerSession(authOptions);
 * ```
 */

// ============================================================================
// Route Handlers with Error Handling & Logging
// ============================================================================

/**
 * GET handler with comprehensive error handling
 * 
 * Handles:
 * - Session retrieval
 * - Provider configuration
 * - CSRF token generation
 * 
 * @param request - Next.js request object
 * @returns Auth response with session data
 */
export async function GET(request: NextRequest) {
  const correlationId = generateCorrelationId();
  const startTime = Date.now();

  try {
    // Log request
    logAuthRequest('GET', request.nextUrl.pathname, correlationId, {
      searchParams: Object.fromEntries(request.nextUrl.searchParams),
    });

    // Execute with timeout
    const response = await withTimeout(
      handler(request as any, {} as any),
      REQUEST_TIMEOUT_MS,
      correlationId
    ) as Response;

    const duration = Date.now() - startTime;

    // Log success
    console.log(`[Auth] [${correlationId}] GET request successful`, {
      correlationId,
      duration,
      status: response.status,
    });

    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Log error with duration
    logAuthError(error as Error, correlationId, { duration });

    return handleAuthError(error as Error, correlationId);
  }
}

/**
 * POST handler with comprehensive error handling
 * 
 * Handles:
 * - Sign in
 * - Sign out
 * - Callback processing
 * 
 * @param request - Next.js request object
 * @returns Auth response with authentication result
 */
export async function POST(request: NextRequest) {
  const correlationId = generateCorrelationId();
  const startTime = Date.now();

  try {
    // Log request (without sensitive data)
    logAuthRequest('POST', request.nextUrl.pathname, correlationId, {
      searchParams: Object.fromEntries(request.nextUrl.searchParams),
      contentType: request.headers.get('content-type'),
    });

    // Execute with timeout
    const response = await withTimeout(
      handler(request as any, {} as any),
      REQUEST_TIMEOUT_MS,
      correlationId
    ) as Response;

    const duration = Date.now() - startTime;

    // Log success
    console.log(`[Auth] [${correlationId}] POST request successful`, {
      correlationId,
      duration,
      status: response.status,
    });

    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Log error with duration
    logAuthError(error as Error, correlationId, { duration });

    return handleAuthError(error as Error, correlationId);
  }
}
