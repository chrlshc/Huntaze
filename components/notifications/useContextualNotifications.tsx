'use client';

import { useEffect } from 'react';
import { useNotifications } from './NotificationProvider';
import { useRouter } from 'next/navigation';

interface NotificationTrigger {
  condition: () => boolean;
  context: string;
  data?: any;
  delay?: number;
  once?: boolean;
}

export function useContextualNotifications(triggers: NotificationTrigger[]) {
  const { showContextualNotification } = useNotifications();
  const router = useRouter();

  useEffect(() => {
    triggers.forEach((trigger) => {
      const checkTrigger = () => {
        if (trigger.condition()) {
          if (trigger.once) {
            const storageKey = `notification_shown_${trigger.context}`;
            if (localStorage.getItem(storageKey)) return;
            localStorage.setItem(storageKey, 'true');
          }

          setTimeout(() => {
            showContextualNotification(trigger.context, trigger.data);
          }, trigger.delay || 0);
        }
      };

      checkTrigger();
    });
  }, [triggers, showContextualNotification]);
}

// Preset triggers for common scenarios
export const commonTriggers = {
  lowResponseRate: (rate: number): NotificationTrigger => ({
    condition: () => rate < 80,
    context: 'low_response_rate',
    data: { rate },
    delay: 3000,
    once: true
  }),
  
  revenueGoalReached: (current: number, goal: number): NotificationTrigger => ({
    condition: () => current >= goal,
    context: 'revenue_milestone',
    data: { amount: current },
    delay: 2000,
    once: true
  }),
  
  inactiveHours: (lastActiveHours: number): NotificationTrigger => ({
    condition: () => lastActiveHours > 24,
    context: 'inactive_reminder',
    delay: 5000
  }),
  
  newFeatureAnnouncement: (feature: string): NotificationTrigger => ({
    condition: () => true,
    context: 'new_feature',
    data: { feature },
    delay: 1000,
    once: true
  })
};