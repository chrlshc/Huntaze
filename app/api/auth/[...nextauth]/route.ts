/**
 * MINIMAL NextAuth v4 - For Testing Only
 * 
 * This is a stripped-down version to isolate Amplify runtime issues.
 * NO database, NO complex logic, just basic NextAuth.
 */

import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

// Log environment at module load
console.log('🔍 [NextAuth Minimal] Module loading...', {
  hasSecret: !!process.env.NEXTAUTH_SECRET,
  hasUrl: !!process.env.NEXTAUTH_URL,
  nodeEnv: process.env.NODE_ENV,
  timestamp: new Date().toISOString(),
});

// Minimal configuration
const handler = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
      },
      async authorize(credentials) {
        console.log('🔐 [NextAuth Minimal] Authorize called', {
          hasCredentials: !!credentials,
          username: credentials?.username,
        });
        
        // Accept anyone with a username
        if (!credentials?.username) {
          console.log('❌ [NextAuth Minimal] No username provided');
          return null;
        }
        
        console.log('✅ [NextAuth Minimal] User authorized');
        return {
          id: 'user-' + credentials.username,
          name: credentials.username,
          email: credentials.username + '@test.com',
        };
      },
    }),
  ],
  pages: {
    signIn: '/auth',
  },
  debug: true,
});

console.log('✅ [NextAuth Minimal] Handler created successfully');

export { handler as GET, handler as POST };
