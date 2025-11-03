/**
 * Feature Tour Service
 * Manages feature tours for new features and re-onboarding
 */

export interface FeatureTour {
  id: string;
  featureId: string;
  title: string;
  description: string;
  steps: TourStep[];
  category: 'new_feature' | 'enhancement' | 'platform';
  releaseDate: Date;
  priority: 'high' | 'medium' | 'low';
}

export interface TourStep {
  id: string;
  title: string;
  content: string;
  target: string; // CSS selector for element to highlight
  placement: 'top' | 'bottom' | 'left' | 'right';
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface TourProgress {
  userId: string;
  tourId: string;
  completedSteps: string[];
  completed: boolean;
  dismissedPermanently: boolean;
  lastViewedAt: Date;
}

class FeatureTourService {
  private tours: Map<string, FeatureTour> = new Map();

  /**
   * Register a new feature tour
   */
  registerTour(tour: FeatureTour): void {
    this.tours.set(tour.id, tour);
  }

  /**
   * Get all available tours
   */
  getAllTours(): FeatureTour[] {
    return Array.from(this.tours.values());
  }

  /**
   * Get tours for a specific feature
   */
  getToursByFeature(featureId: string): FeatureTour[] {
    return Array.from(this.tours.values()).filter(
      tour => tour.featureId === featureId
    );
  }

  /**
   * Get tours released after a specific date
   */
  getNewTours(since: Date): FeatureTour[] {
    return Array.from(this.tours.values()).filter(
      tour => tour.releaseDate > since
    );
  }

  /**
   * Get a specific tour by ID
   */
  getTour(tourId: string): FeatureTour | undefined {
    return this.tours.get(tourId);
  }

  /**
   * Check if user has completed a tour
   */
  async hasCompletedTour(userId: string, tourId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/onboarding/tours/${tourId}/progress?userId=${userId}`);
      if (!response.ok) return false;
      
      const progress: TourProgress = await response.json();
      return progress.completed || progress.dismissedPermanently;
    } catch (error) {
      console.error('Error checking tour completion:', error);
      return false;
    }
  }

  /**
   * Mark a tour step as completed
   */
  async completeStep(userId: string, tourId: string, stepId: string): Promise<void> {
    try {
      await fetch(`/api/onboarding/tours/${tourId}/steps/${stepId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
    } catch (error) {
      console.error('Error completing tour step:', error);
      throw error;
    }
  }

  /**
   * Mark entire tour as completed
   */
  async completeTour(userId: string, tourId: string): Promise<void> {
    try {
      await fetch(`/api/onboarding/tours/${tourId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
    } catch (error) {
      console.error('Error completing tour:', error);
      throw error;
    }
  }

  /**
   * Dismiss a tour permanently
   */
  async dismissTour(userId: string, tourId: string): Promise<void> {
    try {
      await fetch(`/api/onboarding/tours/${tourId}/dismiss`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
    } catch (error) {
      console.error('Error dismissing tour:', error);
      throw error;
    }
  }

  /**
   * Get pending tours for a user
   */
  async getPendingTours(userId: string): Promise<FeatureTour[]> {
    const allTours = this.getAllTours();
    const pending: FeatureTour[] = [];

    for (const tour of allTours) {
      const completed = await this.hasCompletedTour(userId, tour.id);
      if (!completed) {
        pending.push(tour);
      }
    }

    return pending.sort((a, b) => {
      // Sort by priority then by release date
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.releaseDate.getTime() - a.releaseDate.getTime();
    });
  }
}

// Singleton instance
export const featureTourService = new FeatureTourService();

// Register default tours
featureTourService.registerTour({
  id: 'ai-content-generation-tour',
  featureId: 'ai_content_generation',
  title: 'AI Content Generation',
  description: 'Learn how to use AI to create engaging content',
  category: 'new_feature',
  releaseDate: new Date('2024-11-01'),
  priority: 'high',
  steps: [
    {
      id: 'step-1',
      title: 'Welcome to AI Content Generation',
      content: 'Our AI can help you create engaging content for your audience. Let\'s explore how it works.',
      target: '#ai-assistant-button',
      placement: 'bottom',
    },
    {
      id: 'step-2',
      title: 'Choose Your Content Type',
      content: 'Select the type of content you want to create. The AI will adapt its suggestions accordingly.',
      target: '#content-type-selector',
      placement: 'right',
    },
    {
      id: 'step-3',
      title: 'Get AI Suggestions',
      content: 'Click here to get AI-powered suggestions for your content. You can refine and customize them.',
      target: '#get-suggestions-button',
      placement: 'top',
    },
  ],
});

featureTourService.registerTour({
  id: 'bulk-messaging-tour',
  featureId: 'bulk_messaging',
  title: 'Bulk Messaging',
  description: 'Send personalized messages to multiple fans at once',
  category: 'new_feature',
  releaseDate: new Date('2024-11-01'),
  priority: 'high',
  steps: [
    {
      id: 'step-1',
      title: 'Bulk Messaging',
      content: 'Send personalized messages to multiple fans efficiently.',
      target: '#bulk-messaging-nav',
      placement: 'right',
    },
    {
      id: 'step-2',
      title: 'Select Recipients',
      content: 'Choose which fans to message using filters and segments.',
      target: '#recipient-selector',
      placement: 'bottom',
    },
    {
      id: 'step-3',
      title: 'Personalize Your Message',
      content: 'Use variables like {name} to personalize each message automatically.',
      target: '#message-editor',
      placement: 'top',
    },
  ],
});

featureTourService.registerTour({
  id: 'advanced-analytics-tour',
  featureId: 'advanced_analytics',
  title: 'Advanced Analytics',
  description: 'Unlock deeper insights into your performance',
  category: 'new_feature',
  releaseDate: new Date('2024-11-01'),
  priority: 'medium',
  steps: [
    {
      id: 'step-1',
      title: 'Advanced Analytics Dashboard',
      content: 'View comprehensive analytics across all your platforms.',
      target: '#analytics-nav',
      placement: 'right',
    },
    {
      id: 'step-2',
      title: 'Platform Comparison',
      content: 'Compare performance across different platforms to optimize your strategy.',
      target: '#platform-comparison-chart',
      placement: 'top',
    },
    {
      id: 'step-3',
      title: 'Export Reports',
      content: 'Export your analytics data for deeper analysis or reporting.',
      target: '#export-button',
      placement: 'left',
    },
  ],
});
