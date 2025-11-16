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

          // Query user from database
          const result = await query(
            'SELECT id, email, name, password_hash, email_verified FROM users WHERE email = $1',
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
            user.password_hash
          );

          if (!isValidPassword) {
            logger.warn('Authorization failed: Invalid password', {
              email: credentials.email,
            });
            return null;
          }

          // Check if email is verified
          if (!user.email_verified) {
            logger.warn('Authorization failed: Email not verified', {
              email: credentials.email,
              userId: user.id,
            });
            return null;
          }

          const duration = Date.now() - startTime;
          logger.info('Authorization successful', {
            userId: user.id,
            email: user.email,
            duration,
          });

          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
          };
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
