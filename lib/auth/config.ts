/**
 * NextAuth v5 Configuration
 * Compatible with Next.js 16
 * 
 * SERVERLESS-OPTIMIZED VERSION
 * - JWT-only session strategy (no session DB)
 * - Database validation for credentials
 * - Structured logging with correlation IDs
 */

import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { createLogger } from '@/lib/utils/logger';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import '@/lib/types/auth'; // Import type augmentation

// Create logger for NextAuth operations
const logger = createLogger('nextauth');

// Log environment variable status at initialization
logger.info('NextAuth initialization', {
  hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET || !!process.env.AUTH_SECRET,
  hasNextAuthUrl: !!process.env.NEXTAUTH_URL || !!process.env.AUTH_URL,
  nodeEnv: process.env.NODE_ENV,
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: 'jwt', // JWT-only for serverless compatibility
    maxAge: 30 * 24 * 60 * 60, // Default 30 days (can be overridden per-session)
  },
  pages: {
    signIn: '/auth',
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        rememberMe: { label: 'Remember Me', type: 'checkbox' },
      },
      async authorize(credentials) {
        const startTime = Date.now();
        
        try {
          // Validate credentials format
          if (!credentials?.email || !credentials?.password) {
            logger.warn('Authorization failed: Missing credentials', {
              hasEmail: !!credentials?.email,
              hasPassword: !!credentials?.password,
            });
            return null;
          }
          
          // Extract rememberMe flag (will be passed to JWT callback via account)
          const rememberMe = credentials.rememberMe === 'true' || credentials.rememberMe === true;

          // Basic email format validation
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(credentials.email as string)) {
            logger.warn('Authorization failed: Invalid email format', {
              email: credentials.email,
            });
            return null;
          }

          // Query user from database (including onboarding_completed)
          // Use LOWER() to match case-insensitive email (same as registration)
          const result = await query(
            'SELECT id, email, name, password, email_verified, onboarding_completed FROM users WHERE LOWER(email) = LOWER($1)',
            [credentials.email]
          );

          if (result.rows.length === 0) {
            logger.warn('Authorization failed: User not found', {
              email: credentials.email,
            });
            return null;
          }

          const user = result.rows[0];

          // Verify password
          const isValidPassword = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

          if (!isValidPassword) {
            logger.warn('Authorization failed: Invalid password', {
              email: credentials.email,
            });
            return null;
          }

          // Note: Email verification is optional for now
          // Users can login even if email is not verified
          // This allows immediate access after registration
          if (user.email_verified === false) {
            logger.info('User login with unverified email', {
              email: credentials.email,
              userId: user.id,
            });
          }

          const duration = Date.now() - startTime;
          logger.info('Authorization successful', {
            userId: user.id,
            email: user.email,
            onboardingCompleted: user.onboarding_completed,
            rememberMe,
            duration,
          });

          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            // Default to false for new users (they need to complete onboarding)
            // Only existing users without the column will get true
            onboardingCompleted: user.onboarding_completed !== null ? user.onboarding_completed : false,
            rememberMe, // Pass rememberMe to JWT callback
          };
        } catch (error) {
          const duration = Date.now() - startTime;
          logger.error('Authorization error', error as Error, {
            duration,
            email: credentials?.email,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            errorStack: error instanceof Error ? error.stack : undefined,
          });
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      const startTime = Date.now();
      
      try {
        // Add onboarding status and session expiration when user signs in
        if (user) {
          token.id = user.id;
          // Set onboardingCompleted, defaulting to false for new users
          token.onboardingCompleted = user.onboardingCompleted ?? false;
          
          // Handle "Remember Me" functionality
          // rememberMe is passed through the user object from authorize()
          const rememberMe = (user as any).rememberMe === true;
          
          // Set expiration based on rememberMe
          // 30 days if remembered, 24 hours if not
          const expirationSeconds = rememberMe 
            ? 30 * 24 * 60 * 60  // 30 days
            : 24 * 60 * 60;       // 24 hours
          
          // Store expiration time in token
          token.exp = Math.floor(Date.now() / 1000) + expirationSeconds;
          token.rememberMe = rememberMe;
          
          logger.info('JWT token created', {
            userId: user.id,
            onboardingCompleted: token.onboardingCompleted,
            rememberMe,
            expiresIn: rememberMe ? '30 days' : '24 hours',
            trigger,
            duration: Date.now() - startTime,
          });
        }
        
        // Refresh onboarding status on 'update' trigger
        if (trigger === 'update' && token.id) {
          try {
            const result = await query(
              'SELECT onboarding_completed FROM users WHERE id = $1',
              [token.id]
            );
            
            if (result.rows.length > 0) {
              const onboardingStatus = result.rows[0].onboarding_completed;
              token.onboardingCompleted = onboardingStatus !== null ? onboardingStatus : false;
              logger.info('JWT token refreshed', {
                userId: token.id,
                onboardingCompleted: token.onboardingCompleted,
                trigger,
                duration: Date.now() - startTime,
              });
            }
          } catch (refreshError) {
            logger.error('JWT refresh error', refreshError as Error, {
              userId: token.id,
              trigger,
            });
            // Keep existing token value on error
          }
        }
        
        return token;
      } catch (error) {
        logger.error('JWT callback error', error as Error, {
          trigger,
          duration: Date.now() - startTime,
        });
        return token;
      }
    },
    async session({ session, token }) {
      const startTime = Date.now();
      
      try {
        if (session.user) {
          session.user.id = token.id as string;
          session.user.onboardingCompleted = token.onboardingCompleted as boolean;
          logger.info('Session created', {
            userId: token.id,
            onboardingCompleted: token.onboardingCompleted,
            duration: Date.now() - startTime,
          });
        }
        return session;
      } catch (error) {
        logger.error('Session callback error', error as Error, {
          duration: Date.now() - startTime,
        });
        return session;
      }
    },
  },
  // Disable debug mode in production to reduce noise
  debug: process.env.NODE_ENV === 'development',
  events: {
    async signIn({ user, account }) {
      logger.info('Sign in event', {
        userId: user.id,
        email: user.email,
        provider: account?.provider,
      });
      
      // Note: Legacy localStorage token cleanup happens client-side
      // See app/auth/page.tsx for client-side cleanup after successful login
    },
    async signOut() {
      logger.info('Sign out event');
    },
    async createUser({ user }) {
      logger.info('Create user event', {
        userId: user.id,
        email: user.email,
      });
    },
  },
});
