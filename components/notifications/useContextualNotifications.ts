import { useEffect } from 'react';
import { useNotifications } from './NotificationProvider';

interface UserProfile {
  niche?: string;
  monthlyGoal?: number;
  language?: string;
  settings?: any;
}

interface Analytics {
  revenue?: number;
  fanCount?: number;
  responseRate?: number;
  lastContentDate?: Date;
}

export function useContextualNotifications(userProfile?: UserProfile, analytics?: Analytics) {
  const { showContextualNotification } = useNotifications();

  useEffect(() => {
    if (!userProfile || !analytics) return;

    // Check for revenue milestones
    const checkRevenueMilestones = () => {
      const milestones = [1000, 5000, 10000, 25000, 50000, 100000];
      const currentRevenue = analytics.revenue || 0;
      
      for (const milestone of milestones) {
        const key = `revenue_milestone_${milestone}`;
        const hasShown = localStorage.getItem(key);
        
        if (currentRevenue >= milestone && !hasShown) {
          localStorage.setItem(key, 'true');
          showContextualNotification('revenue_milestone', { amount: milestone.toLocaleString() });
          break;
        }
      }
    };

    // Check for content gaps
    const checkContentGaps = () => {
      if (analytics.lastContentDate) {
        const daysSinceLastContent = Math.floor(
          (Date.now() - new Date(analytics.lastContentDate).getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (daysSinceLastContent >= 2) {
          const lastNotification = localStorage.getItem('lastContentGapNotification');
          const today = new Date().toDateString();
          
          if (lastNotification !== today) {
            localStorage.setItem('lastContentGapNotification', today);
            showContextualNotification('content_schedule_reminder', { 
              day: daysSinceLastContent === 2 ? 'tomorrow' : `${daysSinceLastContent} days`
            });
          }
        }
      }
    };

    // Check for AI training opportunities
    const checkAITraining = () => {
      const messageCount = parseInt(localStorage.getItem('totalMessagesProcessed') || '0');
      const lastTrainingReminder = localStorage.getItem('lastAITrainingReminder');
      
      if (messageCount > 100 && messageCount % 100 === 0) {
        if (lastTrainingReminder !== messageCount.toString()) {
          localStorage.setItem('lastAITrainingReminder', messageCount.toString());
          showContextualNotification('ai_training_reminder');
        }
      }
    };

    // Niche-specific notifications
    const checkNicheSpecificEvents = () => {
      const currentHour = new Date().getHours();
      const dayOfWeek = new Date().getDay();
      
      if (userProfile.niche === 'fitness') {
        // Weekend morning notification for fitness creators
        if ((dayOfWeek === 0 || dayOfWeek === 6) && currentHour === 8) {
          const lastWeekendNotification = localStorage.getItem('lastWeekendFitnessNotification');
          const today = new Date().toDateString();
          
          if (lastWeekendNotification !== today) {
            localStorage.setItem('lastWeekendFitnessNotification', today);
            showContextualNotification('tip', {
              title: 'Weekend Workout Time! 💪',
              message: 'Fitness content performs 40% better on weekend mornings'
            });
          }
        }
      } else if (userProfile.niche === 'gaming') {
        // Evening notification for gaming creators
        if (currentHour === 20) {
          const lastGamingNotification = localStorage.getItem('lastGamingPeakNotification');
          const today = new Date().toDateString();
          
          if (lastGamingNotification !== today) {
            localStorage.setItem('lastGamingPeakNotification', today);
            showContextualNotification('tip', {
              title: 'Gaming Prime Time! 🎮',
              message: 'Your audience is most active now. Perfect for streaming!'
            });
          }
        }
      }
    };

    // Run checks
    checkRevenueMilestones();
    checkContentGaps();
    checkAITraining();
    checkNicheSpecificEvents();

    // Set up periodic checks
    const interval = setInterval(() => {
      checkContentGaps();
      checkNicheSpecificEvents();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [userProfile, analytics, showContextualNotification]);

  // Return manual trigger functions
  return {
    notifyNewVIPFan: (fanName: string) => {
      showContextualNotification('new_vip_fan', { fanName });
    },
    notifyAISuccess: (fanName: string) => {
      showContextualNotification('ai_success', { fanName });
    },
    notifySubscriptionExpiring: (count: number) => {
      showContextualNotification('subscription_expiring', { count });
    }
  };
}