'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { 
  TrophyIcon, 
  SparklesIcon, 
  StarIcon,
  CheckCircleIcon,
  GiftIcon
} from '@heroicons/react/24/outline';

interface Achievement {
  id: string;
  title: string;
  description: string;
  type: 'milestone' | 'streak' | 'mastery' | 'speed' | 'engagement';
  icon?: 'trophy' | 'sparkles' | 'star' | 'check' | 'gift';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points?: number;
  unlocked?: boolean;
}

interface CelebrationModalProps {
  isVisible: boolean;
  achievement: Achievement | null;
  onClose: () => void;
  onShare?: (achievement: Achievement) => void;
  onInteraction: (type: string, data?: any) => void;
}

export const CelebrationModal: React.FC<CelebrationModalProps> = ({
  isVisible,
  achievement,
  onClose,
  onShare,
  onInteraction
}) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'enter' | 'celebrate' | 'settle'>('enter');

  useEffect(() => {
    if (isVisible && achievement) {
      setShowConfetti(true);
      setAnimationPhase('enter');
      
      onInteraction('celebration_shown', {
        achievementId: achievement.id,
        type: achievement.type,
        rarity: achievement.rarity
      });

      // Animation sequence
      const timer1 = setTimeout(() => setAnimationPhase('celebrate'), 500);
      const timer2 = setTimeout(() => setAnimationPhase('settle'), 2000);
      const timer3 = setTimeout(() => setShowConfetti(false), 3000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [isVisible, achievement, onInteraction]);

  const handleClose = () => {
    onInteraction('celebration_closed', {
      achievementId: achievement?.id,
      timeViewed: Date.now()
    });
    onClose();
  };

  const handleShare = () => {
    if (achievement && onShare) {
      onInteraction('celebration_shared', {
        achievementId: achievement.id,
        platform: 'social'
      });
      onShare(achievement);
    }
  };

  const getIcon = (iconType?: string) => {
    switch (iconType) {
      case 'trophy':
        return <TrophyIcon className="w-12 h-12" />;
      case 'sparkles':
        return <SparklesIcon className="w-12 h-12" />;
      case 'star':
        return <StarIcon className="w-12 h-12" />;
      case 'check':
        return <CheckCircleIcon className="w-12 h-12" />;
      case 'gift':
        return <GiftIcon className="w-12 h-12" />;
      default:
        return <TrophyIcon className="w-12 h-12" />;
    }
  };

  const getRarityColors = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return {
          bg: 'from-gray-400 to-gray-600',
          text: 'text-gray-100',
          glow: 'shadow-gray-500/50',
          border: 'border-gray-300'
        };
      case 'rare':
        return {
          bg: 'from-blue-400 to-blue-600',
          text: 'text-blue-100',
          glow: 'shadow-blue-500/50',
          border: 'border-blue-300'
        };
      case 'epic':
        return {
          bg: 'from-purple-400 to-purple-600',
          text: 'text-purple-100',
          glow: 'shadow-purple-500/50',
          border: 'border-purple-300'
        };
      case 'legendary':
        return {
          bg: 'from-yellow-400 to-orange-500',
          text: 'text-yellow-100',
          glow: 'shadow-yellow-500/50',
          border: 'border-yellow-300'
        };
      default:
        return {
          bg: 'from-blue-400 to-blue-600',
          text: 'text-blue-100',
          glow: 'shadow-blue-500/50',
          border: 'border-blue-300'
        };
    }
  };

  const colors = achievement ? getRarityColors(achievement.rarity) : getRarityColors('common');

  const modalVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8,
      rotateY: -15
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      rotateY: 0
    },
    exit: { 
      opacity: 0, 
      scale: 0.8,
      rotateY: 15
    }
  };

  const iconVariants = {
    enter: { 
      scale: 0,
      rotate: -180
    },
    celebrate: { 
      scale: [1, 1.2, 1],
      rotate: [0, 10, -10, 0]
    },
    settle: { 
      scale: 1,
      rotate: 0
    }
  };

  const confettiVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1
    }
  };

  const confettiPieceVariants = {
    hidden: { 
      opacity: 0,
      y: -100,
      rotate: 0
    },
    visible: { 
      opacity: [0, 1, 1, 0],
      y: [0, 100, 200, 300],
      rotate: [0, 180, 360, 540]
    }
  };

  const generateConfettiPieces = () => {
    const pieces = [];
    const colors = ['var(--accent-info)', 'var(--accent-error)', 'var(--accent-success)', 'var(--accent-warning)', 'var(--accent-primary)', 'var(--accent-primary)'];
    
    for (let i = 0; i < 20; i++) {
      pieces.push(
        <motion.div
          key={i}
          variants={confettiPieceVariants}
          className="absolute w-2 h-2 rounded"
          style={{
            backgroundColor: colors[Math.floor(Math.random() * colors.length)],
            left: `${Math.random() * 100}%`,
            top: '10%'
          }}
        />
      );
    }
    return pieces;
  };

  if (!achievement) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={handleClose}
          >
            {/* Confetti */}
            <AnimatePresence>
              {showConfetti && (
                <motion.div
                  variants={confettiVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="absolute inset-0 pointer-events-none overflow-hidden"
                >
                  {generateConfettiPieces()}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Modal */}
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={`
                relative bg-white rounded-2xl shadow-2xl border-4 max-w-md w-full
                ${colors.border} ${colors.glow}
              `}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with gradient */}
              <div className={`bg-gradient-to-r ${colors.bg} rounded-t-xl p-6 text-center`}>
                <motion.div
                  variants={iconVariants}
                  animate={animationPhase}
                  className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-white bg-opacity-20 mb-4 ${colors.text}`}
                >
                  {getIcon(achievement.icon)}
                </motion.div>
                
                <h2 className={`text-2xl font-bold ${colors.text} mb-2`}>
                  Achievement Unlocked!
                </h2>
                
                <div className={`inline-block px-3 py-1 rounded-full bg-white bg-opacity-20 ${colors.text} text-sm font-medium`}>
                  {achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1)}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {achievement.title}
                  </h3>
                  <p className="text-gray-600">
                    {achievement.description}
                  </p>
                </div>

                {/* Points */}
                {achievement.points && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-6 text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      +{achievement.points}
                    </div>
                    <div className="text-sm text-gray-600">
                      Experience Points
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  {onShare && (
                    <Button variant="primary" onClick={handleShare}>
  Share Achievement
</Button>
                  )}
                  
                  <Button variant="secondary" onClick={handleClose}>
  Continue
</Button>
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CelebrationModal;