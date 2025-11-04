'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  SparklesIcon, 
  TrophyIcon, 
  FireIcon,
  HeartIcon,
  BoltIcon
} from '@heroicons/react/24/outline';

interface FeedbackEvent {
  id: string;
  type: 'progress' | 'achievement' | 'encouragement' | 'milestone';
  message: string;
  icon?: 'sparkles' | 'trophy' | 'fire' | 'heart' | 'bolt';
  color?: 'blue' | 'green' | 'yellow' | 'purple' | 'red';
  duration?: number;
  position?: 'top' | 'center' | 'bottom';
}

interface RealTimeFeedbackProps {
  userId: string;
  stepId: string;
  predictions?: any;
  behaviorData?: any;
  onInteraction: (type: string, data?: any) => void;
}

export const RealTimeFeedback: React.FC<RealTimeFeedbackProps> = ({
  userId,
  stepId,
  predictions,
  behaviorData,
  onInteraction
}) => {
  const [activeFeedback, setActiveFeedback] = useState<FeedbackEvent[]>([]);
  const [engagementLevel, setEngagementLevel] = useState(0);
  const [progressStreak, setProgressStreak] = useState(0);

  useEffect(() => {
    // Monitor engagement changes
    if (behaviorData?.engagementScore !== undefined) {
      const newEngagement = behaviorData.engagementScore;
      const previousEngagement = engagementLevel;
      
      setEngagementLevel(newEngagement);

      // Trigger feedback based on engagement changes
      if (newEngagement > previousEngagement + 0.2) {
        showFeedback({
          id: `engagement-${Date.now()}`,
          type: 'encouragement',
          message: 'Great engagement! You\'re really getting the hang of this!',
          icon: 'fire',
          color: 'yellow',
          duration: 3000
        });
      } else if (newEngagement < 0.3 && previousEngagement > 0.5) {
        showFeedback({
          id: `low-engagement-${Date.now()}`,
          type: 'encouragement',
          message: 'Take your time - you\'re doing fine!',
          icon: 'heart',
          color: 'blue',
          duration: 4000
        });
      }
    }
  }, [behaviorData?.engagementScore, engagementLevel]);

  useEffect(() => {
    // Monitor success probability changes
    if (predictions?.successProbability !== undefined) {
      const successRate = predictions.successProbability;
      
      if (successRate > 0.8) {
        showFeedback({
          id: `high-success-${Date.now()}`,
          type: 'achievement',
          message: 'Excellent! You\'re mastering this step!',
          icon: 'trophy',
          color: 'green',
          duration: 3000
        });
      } else if (successRate > 0.6) {
        showFeedback({
          id: `good-progress-${Date.now()}`,
          type: 'progress',
          message: 'Nice progress! Keep it up!',
          icon: 'sparkles',
          color: 'blue',
          duration: 2500
        });
      }
    }
  }, [predictions?.successProbability]);

  const showFeedback = (feedback: FeedbackEvent) => {
    setActiveFeedback(prev => [...prev, feedback]);
    
    onInteraction('feedback_shown', {
      feedbackType: feedback.type,
      message: feedback.message,
      stepId
    });

    // Auto-remove feedback after duration
    setTimeout(() => {
      setActiveFeedback(prev => prev.filter(f => f.id !== feedback.id));
    }, feedback.duration || 3000);
  };

  const handleFeedbackDismiss = (feedbackId: string) => {
    setActiveFeedback(prev => prev.filter(f => f.id !== feedbackId));
    onInteraction('feedback_dismissed', { feedbackId, stepId });
  };

  const getIcon = (iconType?: string) => {
    switch (iconType) {
      case 'sparkles':
        return <SparklesIcon className="w-5 h-5" />;
      case 'trophy':
        return <TrophyIcon className="w-5 h-5" />;
      case 'fire':
        return <FireIcon className="w-5 h-5" />;
      case 'heart':
        return <HeartIcon className="w-5 h-5" />;
      case 'bolt':
        return <BoltIcon className="w-5 h-5" />;
      default:
        return <SparklesIcon className="w-5 h-5" />;
    }
  };

  const getColorClasses = (color?: string) => {
    switch (color) {
      case 'blue':
        return {
          bg: 'bg-blue-500',
          text: 'text-blue-50',
          border: 'border-blue-400',
          glow: 'shadow-blue-500/25'
        };
      case 'green':
        return {
          bg: 'bg-green-500',
          text: 'text-green-50',
          border: 'border-green-400',
          glow: 'shadow-green-500/25'
        };
      case 'yellow':
        return {
          bg: 'bg-yellow-500',
          text: 'text-yellow-50',
          border: 'border-yellow-400',
          glow: 'shadow-yellow-500/25'
        };
      case 'purple':
        return {
          bg: 'bg-purple-500',
          text: 'text-purple-50',
          border: 'border-purple-400',
          glow: 'shadow-purple-500/25'
        };
      case 'red':
        return {
          bg: 'bg-red-500',
          text: 'text-red-50',
          border: 'border-red-400',
          glow: 'shadow-red-500/25'
        };
      default:
        return {
          bg: 'bg-blue-500',
          text: 'text-blue-50',
          border: 'border-blue-400',
          glow: 'shadow-blue-500/25'
        };
    }
  };

  const getPositionClasses = (position?: string) => {
    switch (position) {
      case 'top':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      case 'center':
        return 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2';
      case 'bottom':
        return 'bottom-4 left-1/2 transform -translate-x-1/2';
      default:
        return 'top-4 right-4';
    }
  };

  const feedbackVariants = {
    initial: { 
      opacity: 0, 
      scale: 0.8,
      y: -20
    },
    animate: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8,
      y: -20,
      transition: {
        duration: 0.2
      }
    }
  };

  const pulseVariants = {
    pulse: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <>
      {/* Active Feedback Messages */}
      <AnimatePresence>
        {activeFeedback.map((feedback, index) => {
          const colors = getColorClasses(feedback.color);
          const positionClasses = getPositionClasses(feedback.position);

          return (
            <motion.div
              key={feedback.id}
              variants={feedbackVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className={`
                fixed z-50 max-w-sm rounded-lg shadow-lg border-2 
                ${colors.bg} ${colors.border} ${colors.glow}
                ${positionClasses}
              `}
              style={{
                marginTop: feedback.position === 'top' ? `${index * 70}px` : undefined,
                marginBottom: feedback.position === 'bottom' ? `${index * 70}px` : undefined
              }}
            >
              <div className={`p-4 ${colors.text}`}>
                <div className="flex items-center space-x-3">
                  <motion.div
                    variants={pulseVariants}
                    animate="pulse"
                    className="flex-shrink-0"
                  >
                    {getIcon(feedback.icon)}
                  </motion.div>
                  
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {feedback.message}
                    </p>
                  </div>

                  <button
                    onClick={() => handleFeedbackDismiss(feedback.id)}
                    className={`flex-shrink-0 ${colors.text} opacity-70 hover:opacity-100 transition-opacity`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Progress bar for timed feedback */}
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: (feedback.duration || 3000) / 1000, ease: "linear" }}
                className="h-1 bg-white bg-opacity-30 rounded-b-lg"
              />
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Persistent Progress Indicator */}
      {predictions?.successProbability !== undefined && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="fixed bottom-4 left-4 z-40"
        >
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3">
            <div className="flex items-center space-x-3">
              <div className="text-sm font-medium text-gray-700">
                Progress
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ 
                      width: `${predictions.successProbability * 100}%` 
                    }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`h-2 rounded-full ${
                      predictions.successProbability > 0.7 
                        ? 'bg-green-500' 
                        : predictions.successProbability > 0.4 
                        ? 'bg-yellow-500' 
                        : 'bg-red-500'
                    }`}
                  />
                </div>
                
                <span className="text-xs text-gray-500">
                  {Math.round(predictions.successProbability * 100)}%
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Engagement Meter */}
      {behaviorData?.engagementScore !== undefined && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="fixed bottom-4 right-4 z-40"
        >
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3">
            <div className="flex items-center space-x-3">
              <div className="text-sm font-medium text-gray-700">
                Engagement
              </div>
              
              <div className="flex items-center space-x-2">
                <motion.div
                  animate={{ 
                    scale: behaviorData.engagementScore > 0.7 ? [1, 1.1, 1] : 1 
                  }}
                  transition={{ 
                    duration: 1, 
                    repeat: behaviorData.engagementScore > 0.7 ? Infinity : 0 
                  }}
                >
                  {behaviorData.engagementScore > 0.7 ? (
                    <FireIcon className="w-5 h-5 text-orange-500" />
                  ) : behaviorData.engagementScore > 0.4 ? (
                    <HeartIcon className="w-5 h-5 text-blue-500" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-gray-300" />
                  )}
                </motion.div>
                
                <span className="text-xs text-gray-500">
                  {Math.round(behaviorData.engagementScore * 100)}%
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
};

export default RealTimeFeedback;