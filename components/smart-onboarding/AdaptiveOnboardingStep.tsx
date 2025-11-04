'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSmartOnboarding } from '@/hooks/useSmartOnboarding';
import { AdaptiveContent } from './AdaptiveContent';
import { ProgressIndicator } from './ProgressIndicator';
import { SmartNavigation } from './SmartNavigation';

interface AdaptiveOnboardingStepProps {
  stepId: string;
  userId: string;
  initialContent: any;
  onStepComplete: (stepId: string, data: any) => void;
  onStepChange: (direction: 'next' | 'previous') => void;
  className?: string;
}

export const AdaptiveOnboardingStep: React.FC<AdaptiveOnboardingStepProps> = ({
  stepId,
  userId,
  initialContent,
  onStepComplete,
  onStepChange,
  className = ''
}) => {
  const [content, setContent] = useState(initialContent);
  const [isAdapting, setIsAdapting] = useState(false);
  const [adaptationReason, setAdaptationReason] = useState<string | null>(null);
  const stepRef = useRef<HTMLDivElement>(null);
  
  const {
    predictions,
    behaviorData,
    adaptContent,
    trackInteraction,
    isLoading
  } = useSmartOnboarding(userId, stepId);

  // Real-time content adaptation based on ML predictions
  useEffect(() => {
    if (predictions?.successProbability !== undefined && predictions.successProbability < 0.6) {
      handleContentAdaptation('low_success_probability');
    }
  }, [predictions]);

  // Behavioral adaptation
  useEffect(() => {
    if (behaviorData?.struggleIndicators && behaviorData.struggleIndicators.length > 0) {
      handleContentAdaptation('struggle_detected');
    }
  }, [behaviorData]);

  const handleContentAdaptation = async (reason: string) => {
    if (isAdapting) return;

    setIsAdapting(true);
    setAdaptationReason(reason);

    try {
      const adaptedContent = await adaptContent(stepId, {
        reason,
        currentContent: content,
        userBehavior: behaviorData,
        predictions
      });

      // Smooth transition to new content
      setTimeout(() => {
        setContent(adaptedContent);
        setIsAdapting(false);
        setAdaptationReason(null);
      }, 300);

    } catch (error) {
      console.error('Content adaptation failed:', error);
      setIsAdapting(false);
      setAdaptationReason(null);
    }
  };

  const handleInteraction = (interactionType: string, data?: any) => {
    trackInteraction(stepId, interactionType, data);
  };

  const handleStepCompletion = (completionData: any) => {
    handleInteraction('step_completed', completionData);
    onStepComplete(stepId, completionData);
  };

  const adaptationVariants = {
    initial: { opacity: 1, scale: 1 },
    adapting: { 
      opacity: 0.7, 
      scale: 0.98,
      transition: { duration: 0.3 }
    },
    adapted: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.3 }
    }
  };

  const contentVariants = {
    enter: { 
      opacity: 0, 
      y: 20,
      transition: { duration: 0.4, ease: "easeOut" }
    },
    center: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      transition: { duration: 0.3, ease: "easeIn" }
    }
  };

  return (
    <div className={`smart-onboarding-step ${className}`} ref={stepRef}>
      <motion.div
        variants={adaptationVariants}
        animate={isAdapting ? 'adapting' : 'adapted'}
        className="step-container"
      >
        {/* Adaptation Indicator */}
        <AnimatePresence>
          {isAdapting && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="adaptation-indicator"
            >
              <div className="flex items-center space-x-2 bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-blue-700">
                  {adaptationReason === 'low_success_probability' && 'Adjusting content to help you succeed...'}
                  {adaptationReason === 'struggle_detected' && 'Simplifying content based on your needs...'}
                  {!adaptationReason && 'Personalizing your experience...'}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress Indicator */}
        <ProgressIndicator
          currentStep={stepId}
          predictions={predictions}
          behaviorData={behaviorData}
          onInteraction={handleInteraction}
        />

        {/* Adaptive Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={content?.id || stepId}
            variants={contentVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="step-content"
          >
            <AdaptiveContent
              content={content}
              stepId={stepId}
              userId={userId}
              predictions={predictions}
              behaviorData={behaviorData}
              onInteraction={handleInteraction}
              onComplete={handleStepCompletion}
              isLoading={isLoading}
            />
          </motion.div>
        </AnimatePresence>

        {/* Smart Navigation */}
        <SmartNavigation
          stepId={stepId}
          predictions={predictions}
          behaviorData={behaviorData}
          onStepChange={onStepChange}
          onInteraction={handleInteraction}
        />
      </motion.div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-10"
          >
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-sm text-gray-600">Loading...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdaptiveOnboardingStep;