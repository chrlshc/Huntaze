'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, Sparkles, TrendingUp, Users, Calendar } from 'lucide-react';

type NotificationType = 'success' | 'error' | 'info' | 'warning' | 'tip' | 'milestone';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

interface NotificationContextType {
  showNotification: (notification: Omit<Notification, 'id'>) => void;
  showContextualNotification: (context: string, data?: any) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

const getIcon = (type: NotificationType) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="w-5 h-5" />;
    case 'error':
      return <AlertCircle className="w-5 h-5" />;
    case 'info':
      return <Info className="w-5 h-5" />;
    case 'warning':
      return <AlertTriangle className="w-5 h-5" />;
    case 'tip':
      return <Sparkles className="w-5 h-5" />;
    case 'milestone':
      return <TrendingUp className="w-5 h-5" />;
  }
};

const getStyles = (type: NotificationType) => {
  switch (type) {
    case 'success':
      return 'bg-green-50 border-green-200 text-green-800';
    case 'error':
      return 'bg-red-50 border-red-200 text-red-800';
    case 'info':
      return 'bg-blue-50 border-blue-200 text-blue-800';
    case 'warning':
      return 'bg-amber-50 border-amber-200 text-amber-800';
    case 'tip':
      return 'bg-purple-50 border-purple-200 text-purple-800';
    case 'milestone':
      return 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 text-purple-800';
  }
};

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const showNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString();
    const newNotification = {
      ...notification,
      id,
      icon: notification.icon || getIcon(notification.type),
      duration: notification.duration || 5000,
    };

    setNotifications((prev) => [...prev, newNotification]);

    if (newNotification.duration > 0) {
      setTimeout(() => removeNotification(id), newNotification.duration);
    }
  }, [removeNotification]);

  const showContextualNotification = useCallback((context: string, data?: any) => {
    const contextualNotifications: Record<string, () => Omit<Notification, 'id'>> = {
      'first_login': () => ({
        type: 'tip',
        title: 'Welcome to Huntaze! 🎉',
        message: 'Start by connecting your first platform to unlock AI-powered messaging',
        action: {
          label: 'Connect Platform',
          onClick: () => window.location.href = '/platforms/connect'
        }
      }),
      'revenue_milestone': () => ({
        type: 'milestone',
        title: 'Revenue Milestone Reached! 🎯',
        message: `Congratulations! You've earned $${data?.amount || '1,000'} this month`,
        icon: <TrendingUp className="w-5 h-5" />
      }),
      'new_vip_fan': () => ({
        type: 'success',
        title: 'New VIP Fan! 👑',
        message: `${data?.fanName || 'A fan'} just became a VIP supporter`,
        icon: <Users className="w-5 h-5" />,
        action: {
          label: 'Send Welcome',
          onClick: () => window.location.href = '/messages'
        }
      }),
      'ai_training_reminder': () => ({
        type: 'info',
        title: 'AI Training Available',
        message: 'Your AI has learned from 100+ conversations. Train it to improve responses',
        icon: <Sparkles className="w-5 h-5" />,
        action: {
          label: 'Train AI',
          onClick: () => window.location.href = '/ai/training'
        }
      }),
      'content_schedule_reminder': () => ({
        type: 'warning',
        title: 'Content Gap Detected',
        message: `No content scheduled for ${data?.day || 'tomorrow'}. Keep fans engaged!`,
        icon: <Calendar className="w-5 h-5" />,
        action: {
          label: 'Schedule Content',
          onClick: () => window.location.href = '/content/new'
        }
      }),
      'peak_hours_active': () => ({
        type: 'tip',
        title: 'Peak Hours Active! 🔥',
        message: 'Your fans are most active now. Perfect time for live content',
        duration: 10000
      }),
      'subscription_expiring': () => ({
        type: 'warning',
        title: 'Subscription Expiring Soon',
        message: `${data?.count || '5'} fan subscriptions expire this week`,
        action: {
          label: 'Send Renewal Offers',
          onClick: () => window.location.href = '/campaigns/renewal'
        }
      }),
      'ai_success': () => ({
        type: 'success',
        title: 'AI Response Sent',
        message: `Successfully replied to ${data?.fanName || 'fan'}`,
        duration: 3000
      })
    };

    const notification = contextualNotifications[context];
    if (notification) {
      showNotification(notification());
    }
  }, [showNotification]);

  // Check for contextual triggers on mount
  useEffect(() => {
    const checkContextualTriggers = () => {
      const isFirstLogin = !localStorage.getItem('hasLoggedIn');
      if (isFirstLogin) {
        localStorage.setItem('hasLoggedIn', 'true');
        setTimeout(() => showContextualNotification('first_login'), 2000);
      }

      // Check time-based notifications
      const currentHour = new Date().getHours();
      if (currentHour >= 19 && currentHour <= 22) {
        const lastPeakNotification = localStorage.getItem('lastPeakNotification');
        const today = new Date().toDateString();
        if (lastPeakNotification !== today) {
          localStorage.setItem('lastPeakNotification', today);
          setTimeout(() => showContextualNotification('peak_hours_active'), 5000);
        }
      }
    };

    checkContextualTriggers();
  }, [showContextualNotification]);

  return (
    <NotificationContext.Provider value={{ showNotification, showContextualNotification, removeNotification }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-3 pointer-events-none">
        <AnimatePresence>
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`max-w-md w-full bg-white rounded-xl border shadow-lg p-4 pointer-events-auto ${getStyles(notification.type)}`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  notification.type === 'milestone' ? 'bg-gradient-to-r from-purple-100 to-pink-100' : 'bg-white'
                }`}>
                  {notification.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm mb-1">{notification.title}</h4>
                  <p className="text-sm opacity-90">{notification.message}</p>
                  {notification.action && (
                    <button
                      onClick={notification.action.onClick}
                      className="mt-2 text-sm font-medium hover:underline"
                    >
                      {notification.action.label} →
                    </button>
                  )}
                </div>
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="p-1 hover:bg-white/50 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
}