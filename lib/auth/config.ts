/**
 * NextAuth v5 Configuration
 * Compatible with Next.js 16
 * 
 * SERVERLESS-OPTIMIZED VERSION
 * - No external dependencies (no DB, bcrypt, Redis)
 * - JWT-only session strategy
 * - Test credentials for staging validation
 * - Structured logging with correlation IDs
 */

import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { createLogger } from '@/lib/utils/logger';

// Create logger for NextAuth operations
const logger = createLogger('nextauth');

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: 'jwt', // JWT-only for serverless compatibility
    maxAge: 30 * 24 * 60 * 60, // 30 days
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

          // Basic email format validation
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(credentials.email as string)) {
            logger.warn('Authorization failed: Invalid email format', {
              email: credentials.email,
            });
            return null;
          }

          // Test credentials - accept any valid email/password for staging
          const user = {
            id: `test-user-${Date.now()}`,
            email: credentials.email as string,
            name: 'Test User',
          };

          const duration = Date.now() - startTime;
          logger.info('Authorization successful', {
            userId: user.id,
            email: user.email,
            duration,
          });

          return user;
        } catch (error) {
          const duration = Date.now() - startTime;
          logger.error('Authorization error', error as Error, {
            duration,
            email: credentials?.email,
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
        if (user) {
          token.id = user.id;
          logger.info('JWT token created', {
            userId: user.id,
            trigger,
            duration: Date.now() - startTime,
          });
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
          logger.info('Session created', {
            userId: token.id,
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
