'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { 
  HeartIcon, 
  FireIcon, 
  BoltIcon,
  StarIcon,
  SunIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline';

interface MotivationalMessage {
  id: string;
  message: string;
  type: 'encouragement' | 'progress' | 'achievement' | 'persistence' | 'confidence';
  icon: 'heart' | 'fire' | 'bolt' | 'star' | 'sun' | 'rocket';
  color: 'blue' | 'green' | 'yellow' | 'purple' | 'pink' | 'orange';
  trigger: 'low_confidence' | 'high_progress' | 'struggle_detected' | 'milestone_reached' | 'time_spent';
}

interface MotivationalElementsProps {
  predictions?: any;
  behaviorData?: any;
  timeSpent: number;
  onInteraction: (type: string, data?: any) => void;
}

export const MotivationalElements: React.FC<MotivationalElementsProps> = ({
  predictions,
  behaviorData,
  timeSpent,
  onInteraction
}) => {
  const [activeMessage, setActiveMessage] = useState<MotivationalMessage | null>(null);
  const [messageHistory, setMessageHistory] = useState<string[]>([]);
  const [motivationLevel, setMotivationLevel] = useState(0.5);

  const motivationalMessages: MotivationalMessage[] = [
    // Low confidence messages
    {
      id: 'low-conf-1',
      message: "Every expert was once a beginner. You're doing great!",
      type: 'encouragement',
      icon: 'heart',
      color: 'pink',
      trigger: 'low_confidence'
    },
    {
      id: 'low-conf-2',
      message: "Take your time - learning is a journey, not a race.",
      type: 'encouragement',
      icon: 'sun',
      color: 'yellow',
      trigger: 'low_confidence'
    },
    {
      id: 'low-conf-3',
      message: "You're building valuable skills with each step!",
      type: 'confidence',
      icon: 'star',
      color: 'purple',
      trigger: 'low_confidence'
    },

    // High progress messages
    {
      id: 'high-prog-1',
      message: "Fantastic progress! You're really getting the hang of this!",
      type: 'achievement',
      icon: 'fire',
      color: 'orange',
      trigger: 'high_progress'
    },
    {
      id: 'high-prog-2',
      message: "You're on fire! Keep up this amazing momentum!",
      type: 'progress',
      icon: 'bolt',
      color: 'yellow',
      trigger: 'high_progress'
    },
    {
      id: 'high-prog-3',
      message: "Excellent work! You're mastering this quickly!",
      type: 'achievement',
      icon: 'rocket',
      color: 'blue',
      trigger: 'high_progress'
    },

    // Struggle detected messages
    {
      id: 'struggle-1',
      message: "It's okay to find this challenging - that means you're learning!",
      type: 'persistence',
      icon: 'heart',
      color: 'blue',
      trigger: 'struggle_detected'
    },
    {
      id: 'struggle-2',
      message: "Every challenge you overcome makes you stronger!",
      type: 'persistence',
      icon: 'bolt',
      color: 'purple',
      trigger: 'struggle_detected'
    },
    {
      id: 'struggle-3',
      message: "You've got this! Break it down into smaller steps.",
      type: 'encouragement',
      icon: 'star',
      color: 'green',
      trigger: 'struggle_detected'
    },

    // Milestone messages
    {
      id: 'milestone-1',
      message: "Milestone achieved! You're making real progress!",
      type: 'achievement',
      icon: 'star',
      color: 'green',
      trigger: 'milestone_reached'
    },
    {
      id: 'milestone-2',
      message: "Another step completed! You're building momentum!",
      type: 'progress',
      icon: 'rocket',
      color: 'blue',
      trigger: 'milestone_reached'
    },

    // Time-based messages
    {
      id: 'time-1',
      message: "Your dedication is paying off! Keep going!",
      type: 'persistence',
      icon: 'fire',
      color: 'orange',
      trigger: 'time_spent'
    },
    {
      id: 'time-2',
      message: "You're investing in your future - that's awesome!",
      type: 'encouragement',
      icon: 'sun',
      color: 'yellow',
      trigger: 'time_spent'
    }
  ];

  useEffect(() => {
    checkForMotivationalTriggers();
  }, [predictions, behaviorData, timeSpent]);

  const checkForMotivationalTriggers = () => {
    let trigger: string | null = null;
    
    // Check for low confidence
    if (predictions?.successProbability < 0.4) {
      trigger = 'low_confidence';
    }
    // Check for high progress
    else if (predictions?.successProbability > 0.8) {
      trigger = 'high_progress';
    }
    // Check for struggle indicators
    else if (behaviorData?.struggleIndicators?.length > 0) {
      trigger = 'struggle_detected';
    }
    // Check for time spent (engaged for a while)
    else if (timeSpent > 300000) { // 5 minutes
      trigger = 'time_spent';
    }

    if (trigger) {
      showMotivationalMessage(trigger);
    }
  };

  const showMotivationalMessage = (trigger: string) => {
    const availableMessages = motivationalMessages.filter(
      msg => msg.trigger === trigger && !messageHistory.includes(msg.id)
    );

    if (availableMessages.length === 0) return;

    const randomMessage = availableMessages[Math.floor(Math.random() * availableMessages.length)];
    
    // Don't show the same message too frequently
    if (activeMessage?.id === randomMessage.id) return;

    setActiveMessage(randomMessage);
    setMessageHistory(prev => [...prev.slice(-5), randomMessage.id]); // Keep last 5 messages

    onInteraction('motivational_message_shown', {
      messageId: randomMessage.id,
      trigger,
      type: randomMessage.type
    });

    // Auto-hide after 4 seconds
    setTimeout(() => {
      setActiveMessage(null);
    }, 4000);
  };

  const handleMessageDismiss = () => {
    if (activeMessage) {
      onInteraction('motivational_message_dismissed', {
        messageId: activeMessage.id,
        type: activeMessage.type
      });
    }
    setActiveMessage(null);
  };

  const getIcon = (iconType: string) => {
    switch (iconType) {
      case 'heart':
        return <HeartIcon className="w-6 h-6" />;
      case 'fire':
        return <FireIcon className="w-6 h-6" />;
      case 'bolt':
        return <BoltIcon className="w-6 h-6" />;
      case 'star':
        return <StarIcon className="w-6 h-6" />;
      case 'sun':
        return <SunIcon className="w-6 h-6" />;
      case 'rocket':
        return <RocketLaunchIcon className="w-6 h-6" />;
      default:
        return <HeartIcon className="w-6 h-6" />;
    }
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return {
          bg: 'bg-gradient-to-r from-blue-500 to-blue-600',
          text: 'text-blue-50',
          glow: 'shadow-blue-500/25',
          pulse: 'bg-blue-400'
        };
      case 'green':
        return {
          bg: 'bg-gradient-to-r from-green-500 to-green-600',
          text: 'text-green-50',
          glow: 'shadow-green-500/25',
          pulse: 'bg-green-400'
        };
      case 'yellow':
        return {
          bg: 'bg-gradient-to-r from-yellow-500 to-yellow-600',
          text: 'text-yellow-50',
          glow: 'shadow-yellow-500/25',
          pulse: 'bg-yellow-400'
        };
      case 'purple':
        return {
          bg: 'bg-gradient-to-r from-purple-500 to-purple-600',
          text: 'text-purple-50',
          glow: 'shadow-purple-500/25',
          pulse: 'bg-purple-400'
        };
      case 'pink':
        return {
          bg: 'bg-gradient-to-r from-pink-500 to-pink-600',
          text: 'text-pink-50',
          glow: 'shadow-pink-500/25',
          pulse: 'bg-pink-400'
        };
      case 'orange':
        return {
          bg: 'bg-gradient-to-r from-orange-500 to-orange-600',
          text: 'text-orange-50',
          glow: 'shadow-orange-500/25',
          pulse: 'bg-orange-400'
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-blue-500 to-blue-600',
          text: 'text-blue-50',
          glow: 'shadow-blue-500/25',
          pulse: 'bg-blue-400'
        };
    }
  };

  const messageVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8,
      y: 20
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0
    },
    exit: { 
      opacity: 0, 
      scale: 0.8,
      y: -20
    }
  };

  const iconVariants = {
    pulse: {
      scale: [1, 1.2, 1]
    }
  };

  const glowVariants = {
    glow: {
      boxShadow: [
        '0 0 20px rgba(59, 130, 246, 0.3)',
        '0 0 40px rgba(59, 130, 246, 0.5)',
        '0 0 20px rgba(59, 130, 246, 0.3)'
      ]
    }
  };

  if (!activeMessage) return null;

  const colors = getColorClasses(activeMessage.color);

  return (
    <AnimatePresence>
      <motion.div
        variants={messageVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 max-w-sm"
      >
        <motion.div
          variants={glowVariants}
          animate="glow"
          className={`
            ${colors.bg} ${colors.glow} 
            rounded-2xl shadow-2xl border border-white border-opacity-20
          `}
        >
          <div className={`p-6 ${colors.text}`}>
            <div className="flex items-center space-x-4">
              <motion.div
                variants={iconVariants}
                animate="pulse"
                className="flex-shrink-0"
              >
                {getIcon(activeMessage.icon)}
              </motion.div>
              
              <div className="flex-1">
                <p className="text-lg font-medium leading-relaxed">
                  {activeMessage.message}
                </p>
              </div>

              <Button variant="primary" onClick={handleMessageDismiss}>
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
</Button>
            </div>
          </div>

          {/* Animated border */}
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 4, ease: "linear" }}
            className={`h-1 ${colors.pulse} rounded-b-2xl`}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MotivationalElements;