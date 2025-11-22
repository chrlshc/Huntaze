/**
 * Onboarding Page - Beta Launch UI System
 * 
 * 3-step onboarding flow for beta launch:
 * - Step 1: Content type selection
 * - Step 2: OnlyFans connection (optional)
 * - Step 3: Goal selection and revenue goal
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 5.11, 5.12
 */

// Force dynamic rendering - this page requires session
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;

import BetaOnboardingClient from './beta-onboarding-client';

export default function OnboardingPage() {
  return <BetaOnboardingClient />;
}
