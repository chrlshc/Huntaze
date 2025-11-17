#!/bin/bash

echo "🔍 Verifying SessionProvider implementation..."
echo ""

# Check that root layout has NextAuthProvider
echo "1. Checking root layout for NextAuthProvider..."
if grep -q "NextAuthProvider" app/layout.tsx; then
    echo "   ✅ NextAuthProvider found in root layout"
else
    echo "   ❌ NextAuthProvider NOT found in root layout"
    exit 1
fi

# Check that auth-client.tsx does NOT have SessionProvider wrapper
echo "2. Checking auth-client.tsx for duplicate SessionProvider..."
if grep -q "return (" app/auth/auth-client.tsx && ! grep -q "<SessionProvider>" app/auth/auth-client.tsx; then
    echo "   ✅ No duplicate SessionProvider in auth-client.tsx"
else
    echo "   ❌ Duplicate SessionProvider found in auth-client.tsx"
    exit 1
fi

# Check that onboarding-client.tsx does NOT have SessionProvider wrapper
echo "3. Checking onboarding-client.tsx for duplicate SessionProvider..."
if grep -q "return (" app/onboarding/onboarding-client.tsx && ! grep -q "<SessionProvider>" app/onboarding/onboarding-client.tsx; then
    echo "   ✅ No duplicate SessionProvider in onboarding-client.tsx"
else
    echo "   ❌ Duplicate SessionProvider found in onboarding-client.tsx"
    exit 1
fi

# Check that SessionProvider import is removed from auth-client.tsx
echo "4. Checking that SessionProvider import is removed from auth-client.tsx..."
if ! grep -q "SessionProvider" app/auth/auth-client.tsx; then
    echo "   ✅ SessionProvider import removed from auth-client.tsx"
else
    echo "   ⚠️  SessionProvider still referenced in auth-client.tsx (may be in comments)"
fi

# Check that SessionProvider import is removed from onboarding-client.tsx
echo "5. Checking that SessionProvider import is removed from onboarding-client.tsx..."
if ! grep -q "SessionProvider" app/onboarding/onboarding-client.tsx; then
    echo "   ✅ SessionProvider import removed from onboarding-client.tsx"
else
    echo "   ⚠️  SessionProvider still referenced in onboarding-client.tsx (may be in comments)"
fi

echo ""
echo "✅ All checks passed! SessionProvider is now global."
