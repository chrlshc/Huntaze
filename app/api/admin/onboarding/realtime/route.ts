import { NextResponse } from 'next/server';
import { OnboardingAnalyticsService } from '@/lib/services/onboardingAnalyticsService';
import { OnboardingEventsRepository } from '@/lib/db/repositories/onboardingEventsRepository';
import { OnboardingProfileRepository } from '@/lib/db/repositories/onboardingProfileRepository';
import { FeatureUnlockRepository } from '@/lib/db/repositories/featureUnlockRepository';

export async function GET() {
  try {
    // Initialize repositories
    const onboardingEventsRepo = new OnboardingEventsRepository();
    const onboardingProfileRepo = new OnboardingProfileRepository();
    const featureUnlockRepo = new FeatureUnlockRepository();

    // Initialize analytics service
    const analyticsService = new OnboardingAnalyticsService(
      onboardingEventsRepo,
      onboardingProfileRepo,
      featureUnlockRepo
    );

    // Get real-time dashboard data
    const realTimeData = await analyticsService.getRealTimeDashboardData();

    return NextResponse.json(realTimeData);
  } catch (error) {
    console.error('Failed to fetch real-time onboarding data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch real-time data' },
      { status: 500 }
    );
  }
}