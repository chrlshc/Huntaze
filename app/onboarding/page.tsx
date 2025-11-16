/**
 * Onboarding Page
 * 
 * Main onboarding flow using simple Shopify-style questions.
 * Uses NextAuth session-based authentication.
 * 
 * Requirements: 1.1, 1.2, 1.3, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 5.2
 */

// Force dynamic rendering - this page requires session
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;

import OnboardingClient from './onboarding-client';

export default function OnboardingPage() {
  return <OnboardingClient />;
}
