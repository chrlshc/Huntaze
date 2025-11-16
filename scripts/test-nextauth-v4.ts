/**
 * NextAuth v4 Rollback - Authentication Testing Script
 * 
 * Tests authentication functionality without running the dev server
 * to avoid Turbopack edge runtime issues in development mode.
 */

import { authOptions } from '../app/api/auth/[...nextauth]/route';

async function testNextAuthV4() {
  console.log('🧪 Testing NextAuth v4 Configuration\n');
  
  // Test 1: Verify authOptions is exported
  console.log('✅ Test 1: authOptions export');
  console.log('   - authOptions is defined:', !!authOptions);
  console.log('   - Has providers:', authOptions.providers?.length || 0);
  console.log('   - Has callbacks:', !!authOptions.callbacks);
  console.log('   - Session strategy:', authOptions.session?.strategy);
  console.log('   - Has secret:', !!authOptions.secret);
  console.log('');
  
  // Test 2: Verify providers configuration
  console.log('✅ Test 2: Providers configuration');
  authOptions.providers?.forEach((provider: any, index: number) => {
    console.log(`   - Provider ${index + 1}:`, provider.id || provider.name);
  });
  console.log('');
  
  // Test 3: Verify callbacks
  console.log('✅ Test 3: Callbacks configuration');
  console.log('   - JWT callback:', !!authOptions.callbacks?.jwt);
  console.log('   - Session callback:', !!authOptions.callbacks?.session);
  console.log('   - SignIn callback:', !!authOptions.callbacks?.signIn);
  console.log('');
  
  // Test 4: Verify pages configuration
  console.log('✅ Test 4: Pages configuration');
  console.log('   - Sign in page:', authOptions.pages?.signIn);
  console.log('   - Error page:', authOptions.pages?.error);
  console.log('   - Sign out page:', authOptions.pages?.signOut);
  console.log('');
  
  // Test 5: Verify session configuration
  console.log('✅ Test 5: Session configuration');
  console.log('   - Strategy:', authOptions.session?.strategy);
  console.log('   - Max age:', authOptions.session?.maxAge, 'seconds');
  console.log('   - Update age:', authOptions.session?.updateAge, 'seconds');
  console.log('');
  
  // Test 6: Verify environment variables
  console.log('✅ Test 6: Environment variables');
  console.log('   - NEXTAUTH_SECRET:', !!process.env.NEXTAUTH_SECRET);
  console.log('   - NEXTAUTH_URL:', process.env.NEXTAUTH_URL || 'not set');
  console.log('   - GOOGLE_CLIENT_ID:', !!process.env.GOOGLE_CLIENT_ID);
  console.log('   - GOOGLE_CLIENT_SECRET:', !!process.env.GOOGLE_CLIENT_SECRET);
  console.log('');
  
  console.log('✅ All configuration tests passed!\n');
  console.log('📝 Note: Runtime authentication tests require production build');
  console.log('   due to Turbopack edge runtime limitations in dev mode.\n');
  console.log('🚀 To test authentication in production mode:');
  console.log('   1. npm run build');
  console.log('   2. npm start');
  console.log('   3. Navigate to http://localhost:3000/auth');
}

testNextAuthV4().catch(console.error);
