import { describe, it, expect, beforeEach } from 'vitest';

describe('Complete Onboarding Flow Integration', () => {
  const testUserId = 'test-user-123';

  beforeEach(async () => {
    // Clean up test data
    await fetch(`/api/test/cleanup?userId=${testUserId}`, { method: 'DELETE' });
  });

  describe('Full onboarding journey', () => {
    it('should complete entire onboarding flow', async () => {
      // Step 1: Start onboarding
      const startResponse = await fetch('/api/onboarding/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: testUserId }),
      });
      expect(startResponse.ok).toBe(true);
      const startData = await startResponse.json();
      expect(startData.success).toBe(true);

      // Step 2: Complete creator assessment
      const assessmentResponse = await fetch('/api/onboarding/step/creator_assessment/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUserId,
          data: {
            experience: 'intermediate',
            platforms: ['instagram', 'tiktok'],
            contentTypes: ['video', 'image'],
          },
        }),
      });
      expect(assessmentResponse.ok).toBe(true);

      // Step 3: Select goals
      const goalsResponse = await fetch('/api/onboarding/step/goal_selection/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUserId,
          data: {
            goals: ['content_creation', 'audience_growth'],
          },
        }),
      });
      expect(goalsResponse.ok).toBe(true);

      // Step 4: Connect platform
      const platformResponse = await fetch('/api/onboarding/step/platform_connection/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUserId,
          data: {
            platform: 'instagram',
            connected: true,
          },
        }),
      });
      expect(platformResponse.ok).toBe(true);

      // Step 5: Configure AI
      const aiConfigResponse = await fetch('/api/onboarding/step/ai_configuration/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUserId,
          data: {
            verbosity: 'medium',
            helpFrequency: 'moderate',
          },
        }),
      });
      expect(aiConfigResponse.ok).toBe(true);

      // Verify final status
      const statusResponse = await fetch(`/api/onboarding/status?userId=${testUserId}`);
      expect(statusResponse.ok).toBe(true);
      const statusData = await statusResponse.json();
      expect(statusData.data.progress).toBeGreaterThan(80);
      expect(statusData.data.completedSteps).toContain('creator_assessment');
      expect(statusData.data.completedSteps).toContain('goal_selection');
      expect(statusData.data.completedSteps).toContain('platform_connection');
      expect(statusData.data.completedSteps).toContain('ai_configuration');
    });

    it('should unlock features based on actions', async () => {
      // Start onboarding
      await fetch('/api/onboarding/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: testUserId }),
      });

      // Connect Instagram
      await fetch('/api/onboarding/step/platform_connection/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUserId,
          data: { platform: 'instagram', connected: true },
        }),
      });

      // Check unlocked features
      const featuresResponse = await fetch(`/api/features/unlocked?userId=${testUserId}`);
      expect(featuresResponse.ok).toBe(true);
      const featuresData = await featuresResponse.json();
      expect(featuresData.features).toContain('instagram_publishing');
    });

    it('should handle step skipping', async () => {
      // Start onboarding
      await fetch('/api/onboarding/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: testUserId }),
      });

      // Skip optional step
      const skipResponse = await fetch('/api/onboarding/step/additional_platforms/skip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: testUserId }),
      });
      expect(skipResponse.ok).toBe(true);

      // Verify step was skipped
      const statusResponse = await fetch(`/api/onboarding/status?userId=${testUserId}`);
      const statusData = await statusResponse.json();
      expect(statusData.data.skippedSteps).toContain('additional_platforms');
    });
  });

  describe('Feature tour flow', () => {
    it('should track tour progress', async () => {
      const tourId = 'ai-content-generation-tour';

      // Complete first step
      const step1Response = await fetch(`/api/onboarding/tours/${tourId}/steps/step-1/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: testUserId }),
      });
      expect(step1Response.ok).toBe(true);

      // Check progress
      const progressResponse = await fetch(
        `/api/onboarding/tours/${tourId}/progress?userId=${testUserId}`
      );
      expect(progressResponse.ok).toBe(true);
      const progressData = await progressResponse.json();
      expect(progressData.completedSteps).toContain('step-1');
      expect(progressData.completed).toBe(false);
    });

    it('should mark tour as completed', async () => {
      const tourId = 'ai-content-generation-tour';

      // Complete tour
      const completeResponse = await fetch(`/api/onboarding/tours/${tourId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: testUserId }),
      });
      expect(completeResponse.ok).toBe(true);

      // Verify completion
      const progressResponse = await fetch(
        `/api/onboarding/tours/${tourId}/progress?userId=${testUserId}`
      );
      const progressData = await progressResponse.json();
      expect(progressData.completed).toBe(true);
    });

    it('should handle tour dismissal', async () => {
      const tourId = 'ai-content-generation-tour';

      // Dismiss tour
      const dismissResponse = await fetch(`/api/onboarding/tours/${tourId}/dismiss`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: testUserId }),
      });
      expect(dismissResponse.ok).toBe(true);

      // Verify dismissal
      const progressResponse = await fetch(
        `/api/onboarding/tours/${tourId}/progress?userId=${testUserId}`
      );
      const progressData = await progressResponse.json();
      expect(progressData.dismissedPermanently).toBe(true);
    });
  });

  describe('Analytics tracking', () => {
    it('should track onboarding events', async () => {
      // Start onboarding
      await fetch('/api/onboarding/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: testUserId }),
      });

      // Complete a step
      await fetch('/api/onboarding/step/creator_assessment/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUserId,
          data: { experience: 'beginner' },
        }),
      });

      // Verify events were tracked
      const eventsResponse = await fetch(`/api/onboarding/events?userId=${testUserId}`);
      expect(eventsResponse.ok).toBe(true);
      const eventsData = await eventsResponse.json();
      expect(eventsData.events.length).toBeGreaterThan(0);
      expect(eventsData.events.some((e: any) => e.eventType === 'step_completed')).toBe(true);
    });
  });
});
