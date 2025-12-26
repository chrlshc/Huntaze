interface OnboardingEvent {
  userId: string;
  eventType: 'step_started' | 'step_completed' | 'step_skipped' | 'feature_unlocked' | 'onboarding_completed';
  stepId?: string;
  featureId?: string;
  metadata?: Record<string, any>;
}

class OnboardingTracker {
  async trackEvent(event: OnboardingEvent): Promise<void> {
    try {
      // Send to onboarding events API
      await trackOnboardingEvent({
        userId: event.userId,
        eventType: event.eventType,
        stepId: event.stepId,
        timestamp: new Date().toISOString(),
        metadata: {
          ...event.metadata,
          featureId: event.featureId,
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
          referrer: typeof document !== 'undefined' ? document.referrer : undefined,
        },
      });

      // Also send to main analytics system if available
      if (typeof window !== 'undefined' && (window as any).analytics) {
        (window as any).analytics.track(`Onboarding: ${event.eventType}`, {
          stepId: event.stepId,
          featureId: event.featureId,
          ...event.metadata
        });
      }
    } catch (error) {
      console.error('Failed to track onboarding event:', error);
      // Don't throw - tracking failures shouldn't break the app
    }
  }

  async trackStepStarted(userId: string, stepId: string, metadata?: Record<string, any>): Promise<void> {
    await this.trackEvent({
      userId,
      eventType: 'step_started',
      stepId,
      metadata
    });
  }

  async trackStepCompleted(userId: string, stepId: string, duration?: number): Promise<void> {
    await this.trackEvent({
      userId,
      eventType: 'step_completed',
      stepId,
      metadata: { duration }
    });
  }

  async trackStepSkipped(userId: string, stepId: string, reason?: string): Promise<void> {
    await this.trackEvent({
      userId,
      eventType: 'step_skipped',
      stepId,
      metadata: { reason }
    });
  }

  async trackFeatureUnlocked(userId: string, featureId: string): Promise<void> {
    await this.trackEvent({
      userId,
      eventType: 'feature_unlocked',
      featureId,
      metadata: { unlockedAt: new Date().toISOString() }
    });
  }

  async trackOnboardingCompleted(userId: string, totalDuration: number, completedSteps: number): Promise<void> {
    await this.trackEvent({
      userId,
      eventType: 'onboarding_completed',
      metadata: {
        totalDuration,
        completedSteps,
        completedAt: new Date().toISOString()
      }
    });
  }
}

export const onboardingTracker = new OnboardingTracker();
import { trackOnboardingEvent } from '@/lib/services/onboarding';
