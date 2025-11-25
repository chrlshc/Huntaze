/**
 * Simplified Onboarding Page
 * 3-step onboarding flow for new signups
 * 
 * Requirements:
 * - 6.1: Welcome screen with value proposition
 * - 6.2: 3-step onboarding (Connect, Preview, Explore)
 * - 6.3: Progress tracking
 * - 6.4: Skip functionality
 * - 6.5: Redirect to dashboard on completion
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { SimplifiedOnboardingClient } from './onboarding-client';

export const metadata: Metadata = {
  title: 'Welcome to Huntaze',
  description: 'Get started with Huntaze in just 3 simple steps',
};

// Force dynamic rendering since this page uses auth and client components
export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  const session = await auth();
  
  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect('/auth/login');
  }

  // Redirect to dashboard if onboarding already completed
  if (session.user.onboardingCompleted) {
    redirect('/dashboard');
  }

  return <SimplifiedOnboardingClient />;
}
