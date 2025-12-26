'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from "@/components/ui/button";

interface ContextualTooltipProps {
  isVisible: boolean;
  content: {
    title?: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'error';
  };
  targetElement?: HTMLElement | null;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  showCloseButton?: boolean;
  autoHide?: boolean;
  autoHideDelay?: number;
  onDismiss?: () => void;
  onInteraction: (type: string, data?: any) => void;
}

export const ContextualTooltip: React.FC<ContextualTooltipProps> = ({
  isVisible,
  content,
  targetElement,
  position = 'auto',
  showCloseButton = false,
  autoHide = false,
  autoHideDelay = 5000,
  onDismiss,
  onInteraction
}) => {
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [actualPosition, setActualPosition] = useState<'top' | 'bottom' | 'left' | 'right'>('top');
  const tooltipRef = useRef<HTMLDivElement>(null);

  const handleDismiss = useCallback(() => {
    onInteraction('contextual_tooltip_dismissed', { 
      content: content.message.substring(0, 50),
      type: content.type,
      position: actualPosition
    });
    if (onDismiss) onDismiss();
  }, [actualPosition, content, onDismiss, onInteraction]);

  const calculatePosition = useCallback(() => {
    if (!targetElement || !tooltipRef.current) return;

    const targetRect = targetElement.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x = 0;
    let y = 0;
    let finalPosition: 'top' | 'bottom' | 'left' | 'right' = 'top';

    if (position === 'auto') {
      // Determine best position based on available space
      const spaceTop = targetRect.top;
      const spaceBottom = viewportHeight - targetRect.bottom;
      const spaceLeft = targetRect.left;
      const spaceRight = viewportWidth - targetRect.right;

      const maxSpace = Math.max(spaceTop, spaceBottom, spaceLeft, spaceRight);

      if (maxSpace === spaceTop && spaceTop > tooltipRect.height + 10) {
        finalPosition = 'top';
      } else if (maxSpace === spaceBottom && spaceBottom > tooltipRect.height + 10) {
        finalPosition = 'bottom';
      } else if (maxSpace === spaceLeft && spaceLeft > tooltipRect.width + 10) {
        finalPosition = 'left';
      } else {
        finalPosition = 'right';
      }
    } else {
      finalPosition = position;
    }

    // Calculate coordinates based on final position
    switch (finalPosition) {
      case 'top':
        x = targetRect.left + targetRect.width / 2;
        y = targetRect.top - 10;
        break;
      case 'bottom':
        x = targetRect.left + targetRect.width / 2;
        y = targetRect.bottom + 10;
        break;
      case 'left':
        x = targetRect.left - 10;
        y = targetRect.top + targetRect.height / 2;
        break;
      case 'right':
        x = targetRect.right + 10;
        y = targetRect.top + targetRect.height / 2;
        break;
    }

    // Ensure tooltip stays within viewport
    if (finalPosition === 'top' || finalPosition === 'bottom') {
      x = Math.max(10, Math.min(x, viewportWidth - tooltipRect.width - 10));
    } else {
      y = Math.max(10, Math.min(y, viewportHeight - tooltipRect.height - 10));
    }

    setTooltipPosition({ x, y });
    setActualPosition(finalPosition);
  }, [position, targetElement]);

  useEffect(() => {
    if (!isVisible || !targetElement) return;
    const rafId = requestAnimationFrame(() => {
      calculatePosition();
      onInteraction('contextual_tooltip_shown', { 
        content: content.message.substring(0, 50),
        type: content.type,
        position: actualPosition
      });
    });
    return () => cancelAnimationFrame(rafId);
  }, [actualPosition, calculatePosition, content, isVisible, onInteraction, targetElement]);

  useEffect(() => {
    if (isVisible && autoHide) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  }, [autoHide, autoHideDelay, handleDismiss, isVisible]);

  const getColorClasses = () => {
    switch (content.type) {
      case 'info':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          icon: 'text-blue-600',
          arrow: 'border-blue-200'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-800',
          icon: 'text-yellow-600',
          arrow: 'border-yellow-200'
        };
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-800',
          icon: 'text-green-600',
          arrow: 'border-green-200'
        };
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          icon: 'text-red-600',
          arrow: 'border-red-200'
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-800',
          icon: 'text-gray-600',
          arrow: 'border-gray-200'
        };
    }
  };

  const colors = getColorClasses();

  const getArrowClasses = () => {
    const baseClasses = 'absolute w-0 h-0 border-solid';
    
    switch (actualPosition) {
      case 'top':
        return `${baseClasses} border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent ${colors.arrow} -bottom-2 left-1/2 transform -translate-x-1/2`;
      case 'bottom':
        return `${baseClasses} border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent ${colors.arrow} -top-2 left-1/2 transform -translate-x-1/2`;
      case 'left':
        return `${baseClasses} border-t-8 border-b-8 border-l-8 border-t-transparent border-b-transparent ${colors.arrow} -right-2 top-1/2 transform -translate-y-1/2`;
      case 'right':
        return `${baseClasses} border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent ${colors.arrow} -left-2 top-1/2 transform -translate-y-1/2`;
      default:
        return '';
    }
  };

  const tooltipVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8,
      y: actualPosition === 'top' ? 10 : actualPosition === 'bottom' ? -10 : 0,
      x: actualPosition === 'left' ? 10 : actualPosition === 'right' ? -10 : 0
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      x: 0
    },
    exit: { 
      opacity: 0, 
      scale: 0.8,
      y: actualPosition === 'top' ? 10 : actualPosition === 'bottom' ? -10 : 0,
      x: actualPosition === 'left' ? 10 : actualPosition === 'right' ? -10 : 0
    }
  };

  const getTransformOrigin = () => {
    switch (actualPosition) {
      case 'top':
        return 'bottom center';
      case 'bottom':
        return 'top center';
      case 'left':
        return 'right center';
      case 'right':
        return 'left center';
      default:
        return 'center';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={tooltipRef}
          variants={tooltipVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={`
            fixed z-50 max-w-xs rounded-lg shadow-lg border
            ${colors.bg} ${colors.border}
          `}
          style={{
            left: actualPosition === 'left' || actualPosition === 'right' 
              ? tooltipPosition.x 
              : tooltipPosition.x,
            top: actualPosition === 'top' || actualPosition === 'bottom' 
              ? tooltipPosition.y 
              : tooltipPosition.y,
            transformOrigin: getTransformOrigin(),
            transform: actualPosition === 'top' || actualPosition === 'bottom'
              ? 'translateX(-50%)'
              : actualPosition === 'left'
              ? 'translate(-100%, -50%)'
              : actualPosition === 'right'
              ? 'translate(0, -50%)'
              : 'none'
          }}
        >
          {/* Arrow */}
          <div className={getArrowClasses()} />

          {/* Content */}
          <div className="p-3">
            <div className="flex items-start space-x-2">
              <div className={`flex-shrink-0 ${colors.icon}`}>
                <InformationCircleIcon className="w-4 h-4" />
              </div>
              
              <div className="flex-1 min-w-0">
                {content.title && (
                  <h4 className={`font-semibold text-sm ${colors.text} mb-1`}>
                    {content.title}
                  </h4>
                )}
                <p className={`text-sm ${colors.text} leading-relaxed`}>
                  {content.message}
                </p>
              </div>

              {showCloseButton && (
                <Button variant="primary" onClick={handleDismiss}>
  <XMarkIcon className="w-4 h-4" />
</Button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ContextualTooltip;
