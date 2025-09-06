'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Check, Heart, Send, Star, Zap, DollarSign, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

// Quick Action Button - Completes action in 2-3 taps
export function QuickAction({
  icon: Icon,
  label,
  onAction,
  count,
  variant = 'default'
}: {
  icon: any;
  label: string;
  onAction: () => void;
  count?: number;
  variant?: 'default' | 'success' | 'primary';
}) {
  const [isPressed, setIsPressed] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const controls = useAnimation();

  const handleAction = async () => {
    // Haptic feedback simulation
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }

    setIsPressed(true);
    await controls.start({ scale: 0.9 });
    
    onAction();
    
    setShowSuccess(true);
    await controls.start({ scale: 1.1 });
    await controls.start({ scale: 1 });
    
    setTimeout(() => {
      setIsPressed(false);
      setShowSuccess(false);
    }, 1500);
  };

  const colors = {
    default: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
    success: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    primary: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
  };

  return (
    <motion.button
      className={cn(
        "relative flex flex-col items-center justify-center p-4 rounded-2xl transition-all min-w-[80px] min-h-[80px]",
        colors[variant],
        isPressed && "ring-2 ring-purple-500"
      )}
      animate={controls}
      whileTap={{ scale: 0.95 }}
      onClick={handleAction}
    >
      <AnimatePresence mode="wait">
        {showSuccess ? (
          <motion.div
            key="success"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
          >
            <Check className="w-6 h-6 text-green-500" />
          </motion.div>
        ) : (
          <motion.div key="icon">
            <Icon className="w-6 h-6" />
          </motion.div>
        )}
      </AnimatePresence>
      
      <span className="text-xs font-medium mt-2">{label}</span>
      
      {count !== undefined && (
        <motion.span
          className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500 }}
        >
          {count}
        </motion.span>
      )}
    </motion.button>
  );
}

// Swipe Action Card - Slack-style swipe interactions
export function SwipeActionCard({
  children,
  leftAction,
  rightAction,
  onSwipe
}: {
  children: React.ReactNode;
  leftAction?: { icon: any; color: string; action: string };
  rightAction?: { icon: any; color: string; action: string };
  onSwipe?: (action: string) => void;
}) {
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleSwipe = (direction: 'left' | 'right') => {
    const action = direction === 'left' ? rightAction : leftAction;
    if (action && onSwipe) {
      onSwipe(action.action);
      
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(20);
      }
    }
    
    setOffset(0);
    setIsDragging(false);
  };

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Background actions */}
      {leftAction && (
        <div
          className={cn(
            "absolute inset-y-0 left-0 w-20 flex items-center justify-center",
            leftAction.color
          )}
          style={{
            opacity: Math.max(0, offset) / 100
          }}
        >
          <leftAction.icon className="w-6 h-6 text-white" />
        </div>
      )}
      
      {rightAction && (
        <div
          className={cn(
            "absolute inset-y-0 right-0 w-20 flex items-center justify-center",
            rightAction.color
          )}
          style={{
            opacity: Math.max(0, -offset) / 100
          }}
        >
          <rightAction.icon className="w-6 h-6 text-white" />
        </div>
      )}

      {/* Swipeable content */}
      <motion.div
        ref={cardRef}
        className="relative bg-white dark:bg-gray-900 touch-pan-y"
        drag="x"
        dragConstraints={{ left: -100, right: 100 }}
        dragElastic={0.2}
        onDragStart={() => setIsDragging(true)}
        onDrag={(_, info) => setOffset(info.offset.x)}
        onDragEnd={(_, info) => {
          if (Math.abs(info.offset.x) > 75) {
            handleSwipe(info.offset.x > 0 ? 'right' : 'left');
          } else {
            setOffset(0);
            setIsDragging(false);
          }
        }}
        animate={{ x: isDragging ? offset : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      >
        {children}
      </motion.div>
    </div>
  );
}

// Long Press Action - Instagram-style quick reactions
export function LongPressAction({
  children,
  actions,
  onAction
}: {
  children: React.ReactNode;
  actions: { icon: any; label: string; value: string }[];
  onAction: (value: string) => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const handlePressStart = () => {
    timeoutRef.current = setTimeout(() => {
      setShowActions(true);
      if ('vibrate' in navigator) {
        navigator.vibrate(30);
      }
    }, 500);
  };

  const handlePressEnd = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleAction = (value: string) => {
    onAction(value);
    setShowActions(false);
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  return (
    <div className="relative">
      <div
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressEnd}
      >
        {children}
      </div>

      <AnimatePresence>
        {showActions && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowActions(false)}
            />
            
            <motion.div
              className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-2 flex gap-2 z-50"
              initial={{ scale: 0, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              {actions.map((action) => (
                <motion.button
                  key={action.value}
                  className="p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleAction(action.value)}
                >
                  <action.icon className="w-6 h-6" />
                  <span className="text-xs mt-1 block">{action.label}</span>
                </motion.button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Double Tap Like - Instagram/TikTok style
export function DoubleTapLike({
  children,
  onLike
}: {
  children: React.ReactNode;
  onLike: () => void;
}) {
  const [showHeart, setShowHeart] = useState(false);
  const [tapPosition, setTapPosition] = useState({ x: 0, y: 0 });
  const lastTapRef = useRef<number>(0);

  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    const currentTime = Date.now();
    const tapDelay = currentTime - lastTapRef.current;
    
    if (tapDelay < 300) {
      // Double tap detected
      const rect = e.currentTarget.getBoundingClientRect();
      const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
      const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
      
      setTapPosition({ x, y });
      setShowHeart(true);
      onLike();
      
      if ('vibrate' in navigator) {
        navigator.vibrate([10, 10, 10]);
      }
      
      setTimeout(() => setShowHeart(false), 1500);
    }
    
    lastTapRef.current = currentTime;
  };

  return (
    <div className="relative" onClick={handleTap} onTouchEnd={handleTap}>
      {children}
      
      <AnimatePresence>
        {showHeart && (
          <motion.div
            className="absolute pointer-events-none"
            style={{ left: tapPosition.x, top: tapPosition.y }}
            initial={{ scale: 0, opacity: 1, y: 0 }}
            animate={{ scale: 3, opacity: 0, y: -50 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Heart className="w-12 h-12 text-red-500 fill-red-500" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Floating Quick Actions Menu
export function FloatingQuickMenu({
  isOpen,
  onClose,
  actions
}: {
  isOpen: boolean;
  onClose: () => void;
  actions: { icon: any; label: string; onClick: () => void }[];
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          <motion.div
            className="fixed bottom-20 right-4 z-50"
            initial={{ opacity: 0, scale: 0, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            {actions.map((action, index) => (
              <motion.button
                key={index}
                className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-full px-4 py-3 shadow-lg mb-3 min-w-[160px]"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  action.onClick();
                  onClose();
                }}
              >
                <action.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{action.label}</span>
              </motion.button>
            ))}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Inline Quick Reply - WhatsApp style
export function InlineQuickReply({
  suggestions,
  onSelect
}: {
  suggestions: string[];
  onSelect: (text: string) => void;
}) {
  return (
    <motion.div
      className="flex gap-2 overflow-x-auto hide-scrollbar p-2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {suggestions.map((suggestion, index) => (
        <motion.button
          key={index}
          className="flex-shrink-0 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium whitespace-nowrap"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(suggestion)}
        >
          {suggestion}
        </motion.button>
      ))}
    </motion.div>
  );
}