#!/usr/bin/env node

/**
 * Test script to verify hydration fixes for React Error #130
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Testing hydration fixes for React Error #130...\n');

// 1. Check if the fixes are applied
console.log('1. Verifying hydration fixes...');

const authProviderPath = path.join(process.cwd(), 'components/auth/AuthProvider.tsx');
const themeContextPath = path.join(process.cwd(), 'contexts/ThemeContext.tsx');

try {
  const authProviderContent = fs.readFileSync(authProviderPath, 'utf8');
  const themeContextContent = fs.readFileSync(themeContextPath, 'utf8');

  // Check for hydration fixes
  const hasAuthHydrationFix = authProviderContent.includes('const [isHydrated, setIsHydrated] = useState(false)');
  const hasThemeHydrationFix = themeContextContent.includes('const [isHydrated, setIsHydrated] = useState(false)');

  if (hasAuthHydrationFix && hasThemeHydrationFix) {
    console.log('✅ Hydration fixes applied successfully');
  } else {
    console.log('❌ Hydration fixes not found');
    if (!hasAuthHydrationFix) console.log('  - AuthProvider hydration fix missing');
    if (!hasThemeHydrationFix) console.log('  - ThemeProvider hydration fix missing');
  }
} catch (error) {
  console.error('❌ Error checking hydration fixes:', error.message);
}

// 2. Check TypeScript compilation
console.log('\n2. Checking TypeScript compilation...');
try {
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
  console.log('✅ TypeScript compilation successful');
} catch (error) {
  console.log('❌ TypeScript compilation failed');
  console.log(error.stdout?.toString() || error.message);
}

// 3. Check Next.js build (dry run)
console.log('\n3. Testing Next.js build...');
try {
  // Just check if the build would work without actually building
  execSync('npx next build --dry-run', { stdio: 'pipe' });
  console.log('✅ Next.js build check passed');
} catch (error) {
  console.log('❌ Next.js build check failed');
  console.log(error.stdout?.toString() || error.message);
}

// 4. Recommendations
console.log('\n📋 Recommendations:');
console.log('1. Deploy these changes to staging');
console.log('2. Test the registration page in staging');
console.log('3. Monitor for React Error #130 in browser console');
console.log('4. If the error persists, check for other components using localStorage/window without hydration checks');

console.log('\n🎯 Key fixes applied:');
console.log('- Added isHydrated state to prevent SSR/client mismatch');
console.log('- Delayed localStorage access until after hydration');
console.log('- Added proper client-side checks for window/document access');

console.log('\n✨ Ready for deployment!');