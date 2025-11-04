'use client';

import { useState, useEffect, useCallback } from 'react';

interface SmartOnboardingData {
  predictions?: {
    successProbability: number;
    positiveFactors?: string[];
    suggestions?: string[];
  };
  behaviorData?: {
    struggleIndicators: string[];
    engagementScore: number;
    timeSpent: number;
  };
  isLoading: boolean;
}

interface UseSmartOnboardingReturn extends SmartOnboardingData {
  adaptContent: (stepId: string, context: any) => Promise<any>;
  trackInteraction: (stepId: string, type: string, data?: any) => void;
  refreshPredictions: () => Promise<void>;
}

export const useSmartOnboarding = (
  userId: string, 
  stepId: string
): UseSmartOnboardingReturn => {
  const [predictions, setPredictions] = useState<SmartOnboardingData['predictions']>();
  const [behaviorData, setBehaviorData] = useState<SmartOnboardingData['behaviorData']>();
  const [isLoading, setIsLoading] = useState(false);

  // Fetch initial predictions and behavior data
  const fetchSmartOnboardingData = useCallback(async () => {
    if (!userId || !stepId) return;

    setIsLoading(true);
    try {
      // Fetch predictions
      const predictionsResponse = await fetch(
        `/api/smart-onboarding/prediction/success?userId=${userId}&stepId=${stepId}`
      );
      
      if (predictionsResponse.ok) {
        const predictionsData = await predictionsResponse.json();
        setPredictions(predictionsData);
      }

      // Fetch behavior analytics
      const behaviorResponse = await fetch(
        `/api/smart-onboarding/analytics/engagement?userId=${userId}&stepId=${stepId}`
      );
      
      if (behaviorResponse.ok) {
        const behaviorAnalytics = await behaviorResponse.json();
        setBehaviorData(behaviorAnalytics);
      }

    } catch (error) {
      console.error('Failed to fetch smart onboarding data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, stepId]);

  // Track user interactions
  const trackInteraction = useCallback(async (
    stepId: string, 
    type: string, 
    data?: any
  ) => {
    try {
      await fetch('/api/smart-onboarding/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          stepId,
          eventType: type,
          eventData: data,
          timestamp: new Date().toISOString()
        }),
      });

      // Refresh predictions after significant interactions
      const significantInteractions = [
        'step_completed',
        'struggle_detected',
        'help_requested',
        'content_adapted'
      ];

      if (significantInteractions.includes(type)) {
        // Debounce prediction refresh
        setTimeout(() => {
          refreshPredictions();
        }, 1000);
      }

    } catch (error) {
      console.error('Failed to track interaction:', error);
    }
  }, [userId]);

  // Adapt content based on ML predictions
  const adaptContent = useCallback(async (
    stepId: string, 
    context: any
  ): Promise<any> => {
    try {
      const response = await fetch('/api/smart-onboarding/integration/adaptive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          stepId,
          context,
          currentPredictions: predictions,
          currentBehavior: behaviorData
        }),
      });

      if (response.ok) {
        const adaptedContent = await response.json();
        
        // Track the adaptation
        trackInteraction(stepId, 'content_adapted', {
          reason: context.reason,
          adaptationType: adaptedContent.adaptationType
        });

        return adaptedContent;
      }

      throw new Error('Failed to adapt content');
    } catch (error) {
      console.error('Content adaptation failed:', error);
      throw error;
    }
  }, [userId, predictions, behaviorData, trackInteraction]);

  // Refresh predictions
  const refreshPredictions = useCallback(async () => {
    await fetchSmartOnboardingData();
  }, [fetchSmartOnboardingData]);

  // Initialize data on mount and when dependencies change
  useEffect(() => {
    fetchSmartOnboardingData();
  }, [fetchSmartOnboardingData]);

  // Set up real-time updates via WebSocket (optional)
  useEffect(() => {
    if (!userId || !stepId) return;

    // This would connect to a WebSocket for real-time updates
    // For now, we'll use polling as a fallback
    const interval = setInterval(() => {
      fetchSmartOnboardingData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [userId, stepId, fetchSmartOnboardingData]);

  return {
    predictions,
    behaviorData,
    isLoading,
    adaptContent,
    trackInteraction,
    refreshPredictions
  };
};