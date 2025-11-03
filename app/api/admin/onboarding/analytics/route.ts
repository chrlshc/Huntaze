import { NextRequest, NextResponse } from 'next/server';
import { OnboardingAnalyticsService } from '@/lib/services/onboardingAnalyticsService';
import { OnboardingEventsRepository } from '@/lib/db/repositories/onboardingEventsRepository';
import { OnboardingProfileRepository } from '@/lib/db/repositories/onboardingProfileRepository';
import { FeatureUnlockRepository } from '@/lib/db/repositories/featureUnlockRepository';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '7d';

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (range) {
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

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

    // Get metrics
    const metrics = await analyticsService.getOnboardingMetrics({
      start: startDate,
      end: now
    });

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Failed to fetch onboarding analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}