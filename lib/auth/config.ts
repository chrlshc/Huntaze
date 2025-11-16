/**
 * NextAuth v5 Configuration
 * Compatible with Next.js 16
 * 
 * MINIMAL VERSION - No DB, for testing only
 */

import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: 'jwt',
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
        // MINIMAL: Accept any credentials for testing
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Return a test user
        return {
          id: 'test-user-id',
          email: credentials.email as string,
          name: 'Test User',
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  debug: process.env.NODE_ENV === 'development',
});
