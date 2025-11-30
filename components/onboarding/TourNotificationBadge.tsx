'use client';

import { useState, useEffect } from 'react';
import { Sparkles, X } from 'lucide-react';
import { featureTourService, FeatureTour } from '@/lib/services/featureTourService';
import FeatureTourGuide from './FeatureTourGuide';
import { Button } from "@/components/ui/button";
import { Card } from '@/components/ui/card';

interface TourNotificationBadgeProps {
  userId: string;
  position?: 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left';
}

export default function TourNotificationBadge({ 
  userId, 
  position = 'bottom-right' 
}: TourNotificationBadgeProps) {
  const [pendingTours, setPendingTours] = useState<FeatureTour[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTour, setActiveTour] = useState<FeatureTour | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    loadPendingTours();
  }, [userId]);

  const loadPendingTours = async () => {
    try {
      const tours = await featureTourService.getPendingTours(userId);
      setPendingTours(tours);
    } catch (error) {
      console.error('Error loading pending tours:', error);
    }
  };

  const handleStartTour = (tour: FeatureTour) => {
    setActiveTour(tour);
    setIsOpen(false);
  };

  const handleTourComplete = () => {
    setActiveTour(null);
    loadPendingTours(); // Refresh pending tours
  };

  const handleTourDismiss = () => {
    setActiveTour(null);
    loadPendingTours(); // Refresh pending tours
  };

  const handleDismissNotification = () => {
    setDismissed(true);
    setIsOpen(false);
  };

  if (pendingTours.length === 0 || dismissed) return null;

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-left': 'top-4 left-4',
  };

  return (
    <>
      {/* Notification Badge */}
      <div className={`fixed ${positionClasses[position]} z-30`}>
        {!isOpen ? (
          <Button 
            variant="primary" 
            onClick={() => setIsOpen(true)}
            className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all hover:scale-110 animate-pulse"
            aria-label="New features available"
          >
            <Sparkles className="w-6 h-6" />
            {pendingTours.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                {pendingTours.length}
              </span>
            )}
          </Button>
        ) : (
          <Card className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 w-80 max-h-96 overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  New Features
                </h3>
              </div>
              <Button variant="primary" onClick={handleDismissNotification} aria-label="Close">
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Discover new features and improvements. Take a quick tour to learn how to use them.
            </p>

            {/* Tour List */}
            <div className="space-y-3">
              {pendingTours.map((tour) => (
                <div
                  key={tour.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {tour.title}
                    </h4>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        tour.priority === 'high'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                          : tour.priority === 'medium'
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {tour.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {tour.description}
                  </p>
                  <Button 
                    variant="primary" 
                    onClick={() => handleStartTour(tour)}
                    className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    Start Tour ({tour.steps.length} steps)
                  </Button>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="primary" onClick={handleDismissNotification}>
                Remind me later
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Active Tour */}
      {activeTour && (
        <FeatureTourGuide
          tour={activeTour}
          userId={userId}
          onComplete={handleTourComplete}
          onDismiss={handleTourDismiss}
        />
      )}
    </>
  );
}
