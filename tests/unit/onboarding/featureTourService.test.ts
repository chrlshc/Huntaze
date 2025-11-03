import { describe, it, expect, beforeEach, vi } from 'vitest';
import { featureTourService, FeatureTour } from '@/lib/services/featureTourService';

describe('FeatureTourService', () => {
  const mockTour: FeatureTour = {
    id: 'test-tour',
    featureId: 'test_feature',
    title: 'Test Tour',
    description: 'A test tour',
    category: 'new_feature',
    releaseDate: new Date('2024-11-01'),
    priority: 'high',
    steps: [
      {
        id: 'step-1',
        title: 'Step 1',
        content: 'First step',
        target: '#test-element',
        placement: 'bottom',
      },
    ],
  };

  beforeEach(() => {
    // Clear any existing tours
    featureTourService['tours'].clear();
  });

  describe('registerTour', () => {
    it('should register a new tour', () => {
      featureTourService.registerTour(mockTour);
      const tour = featureTourService.getTour('test-tour');
      expect(tour).toEqual(mockTour);
    });

    it('should overwrite existing tour with same ID', () => {
      featureTourService.registerTour(mockTour);
      const updatedTour = { ...mockTour, title: 'Updated Tour' };
      featureTourService.registerTour(updatedTour);
      
      const tour = featureTourService.getTour('test-tour');
      expect(tour?.title).toBe('Updated Tour');
    });
  });

  describe('getAllTours', () => {
    it('should return all registered tours', () => {
      featureTourService.registerTour(mockTour);
      const tour2 = { ...mockTour, id: 'tour-2' };
      featureTourService.registerTour(tour2);

      const tours = featureTourService.getAllTours();
      expect(tours).toHaveLength(2);
    });

    it('should return empty array when no tours registered', () => {
      const tours = featureTourService.getAllTours();
      expect(tours).toEqual([]);
    });
  });

  describe('getToursByFeature', () => {
    it('should return tours for specific feature', () => {
      featureTourService.registerTour(mockTour);
      const tour2 = { ...mockTour, id: 'tour-2', featureId: 'other_feature' };
      featureTourService.registerTour(tour2);

      const tours = featureTourService.getToursByFeature('test_feature');
      expect(tours).toHaveLength(1);
      expect(tours[0].id).toBe('test-tour');
    });
  });

  describe('getNewTours', () => {
    it('should return tours released after given date', () => {
      const oldTour = { ...mockTour, id: 'old-tour', releaseDate: new Date('2024-10-01') };
      const newTour = { ...mockTour, id: 'new-tour', releaseDate: new Date('2024-11-15') };
      
      featureTourService.registerTour(oldTour);
      featureTourService.registerTour(newTour);

      const tours = featureTourService.getNewTours(new Date('2024-11-01'));
      expect(tours).toHaveLength(1);
      expect(tours[0].id).toBe('new-tour');
    });
  });

  describe('hasCompletedTour', () => {
    it('should return true when tour is completed', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ completed: true, dismissedPermanently: false }),
      });

      const result = await featureTourService.hasCompletedTour('user-1', 'tour-1');
      expect(result).toBe(true);
    });

    it('should return true when tour is permanently dismissed', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ completed: false, dismissedPermanently: true }),
      });

      const result = await featureTourService.hasCompletedTour('user-1', 'tour-1');
      expect(result).toBe(true);
    });

    it('should return false when tour is not completed', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ completed: false, dismissedPermanently: false }),
      });

      const result = await featureTourService.hasCompletedTour('user-1', 'tour-1');
      expect(result).toBe(false);
    });

    it('should return false on API error', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('API Error'));

      const result = await featureTourService.hasCompletedTour('user-1', 'tour-1');
      expect(result).toBe(false);
    });
  });

  describe('completeStep', () => {
    it('should call API to complete step', async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: true });
      global.fetch = mockFetch;

      await featureTourService.completeStep('user-1', 'tour-1', 'step-1');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/onboarding/tours/tour-1/steps/step-1/complete',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ userId: 'user-1' }),
        })
      );
    });
  });

  describe('completeTour', () => {
    it('should call API to complete tour', async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: true });
      global.fetch = mockFetch;

      await featureTourService.completeTour('user-1', 'tour-1');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/onboarding/tours/tour-1/complete',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ userId: 'user-1' }),
        })
      );
    });
  });

  describe('dismissTour', () => {
    it('should call API to dismiss tour', async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: true });
      global.fetch = mockFetch;

      await featureTourService.dismissTour('user-1', 'tour-1');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/onboarding/tours/tour-1/dismiss',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ userId: 'user-1' }),
        })
      );
    });
  });

  describe('getPendingTours', () => {
    it('should return tours sorted by priority and date', async () => {
      const highPriorityTour = { ...mockTour, id: 'high', priority: 'high' as const };
      const mediumPriorityTour = { ...mockTour, id: 'medium', priority: 'medium' as const };
      const lowPriorityTour = { ...mockTour, id: 'low', priority: 'low' as const };

      featureTourService.registerTour(lowPriorityTour);
      featureTourService.registerTour(mediumPriorityTour);
      featureTourService.registerTour(highPriorityTour);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ completed: false, dismissedPermanently: false }),
      });

      const tours = await featureTourService.getPendingTours('user-1');

      expect(tours[0].id).toBe('high');
      expect(tours[1].id).toBe('medium');
      expect(tours[2].id).toBe('low');
    });

    it('should exclude completed tours', async () => {
      featureTourService.registerTour(mockTour);
      const tour2 = { ...mockTour, id: 'tour-2' };
      featureTourService.registerTour(tour2);

      global.fetch = vi.fn().mockImplementation((url) => {
        if (url.includes('test-tour')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ completed: true, dismissedPermanently: false }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ completed: false, dismissedPermanently: false }),
        });
      });

      const tours = await featureTourService.getPendingTours('user-1');
      expect(tours).toHaveLength(1);
      expect(tours[0].id).toBe('tour-2');
    });
  });
});
