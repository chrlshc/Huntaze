'use client';

import { useRef, useState, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TouchGesturesProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onLongPress?: () => void;
  onDoubleTap?: () => void;
  onPinch?: (scale: number) => void;
  className?: string;
  threshold?: number;
  longPressDelay?: number;
}

export function TouchGestures({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onLongPress,
  onDoubleTap,
  onPinch,
  className,
  threshold = 50,
  longPressDelay = 500
}: TouchGesturesProps) {
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);
  const longPressTimer = useRef<NodeJS.Timeout>();
  const lastTapTime = useRef(0);
  const [isPressing, setIsPressing] = useState(false);
  
  // Pinch gesture state
  const initialPinchDistance = useRef(0);

  const triggerHaptic = (pattern?: number | number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern || 10);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    touchStartTime.current = Date.now();
    setIsPressing(true);

    // Handle pinch start
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      initialPinchDistance.current = Math.sqrt(dx * dx + dy * dy);
    }

    // Long press detection
    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        onLongPress();
        triggerHaptic([50, 50, 50]);
        setIsPressing(false);
      }, longPressDelay);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Cancel long press on move
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }

    // Handle pinch gesture
    if (e.touches.length === 2 && onPinch) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (initialPinchDistance.current > 0) {
        const scale = distance / initialPinchDistance.current;
        onPinch(scale);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsPressing(false);
    
    // Clear long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }

    const touchEndTime = Date.now();
    const touchDuration = touchEndTime - touchStartTime.current;

    // Double tap detection
    if (onDoubleTap && touchDuration < 300) {
      const timeSinceLastTap = touchEndTime - lastTapTime.current;
      if (timeSinceLastTap < 300) {
        onDoubleTap();
        triggerHaptic([10, 50, 10]);
        lastTapTime.current = 0;
      } else {
        lastTapTime.current = touchEndTime;
      }
    }

    // Swipe detection
    if (touchDuration < 300 && e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartX.current;
      const deltaY = touch.clientY - touchStartY.current;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      if (absDeltaX > threshold || absDeltaY > threshold) {
        if (absDeltaX > absDeltaY) {
          // Horizontal swipe
          if (deltaX > 0 && onSwipeRight) {
            onSwipeRight();
            triggerHaptic(20);
          } else if (deltaX < 0 && onSwipeLeft) {
            onSwipeLeft();
            triggerHaptic(20);
          }
        } else {
          // Vertical swipe
          if (deltaY > 0 && onSwipeDown) {
            onSwipeDown();
            triggerHaptic(20);
          } else if (deltaY < 0 && onSwipeUp) {
            onSwipeUp();
            triggerHaptic(20);
          }
        }
      }
    }

    // Reset pinch
    initialPinchDistance.current = 0;
  };

  return (
    <div
      className={cn(
        'touch-none select-none',
        isPressing && 'opacity-90',
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
}

// 3D Touch / Force Touch simulation
interface ForceTouchProps {
  children: ReactNode;
  onForceChange?: (force: number) => void;
  onForceClick?: () => void;
  className?: string;
  forceThreshold?: number;
}

export function ForceTouch({
  children,
  onForceChange,
  onForceClick,
  className,
  forceThreshold = 0.5
}: ForceTouchProps) {
  const [force, setForce] = useState(0);
  const [isForceClicking, setIsForceClicking] = useState(false);

  const handleTouchForceChange = (e: any) => {
    // This is experimental and only works on some devices
    if (e.touches && e.touches[0] && 'force' in e.touches[0]) {
      const touchForce = e.touches[0].force;
      setForce(touchForce);
      
      if (onForceChange) {
        onForceChange(touchForce);
      }
      
      if (touchForce > forceThreshold && !isForceClicking) {
        setIsForceClicking(true);
        if (onForceClick) {
          onForceClick();
          if ('vibrate' in navigator) {
            navigator.vibrate([30, 30, 30]);
          }
        }
      }
    }
  };

  const handleTouchEnd = () => {
    setForce(0);
    setIsForceClicking(false);
  };

  return (
    <div
      className={cn(
        'relative',
        isForceClicking && 'scale-95',
        className
      )}
      onTouchStart={handleTouchForceChange}
      onTouchMove={handleTouchForceChange}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: `scale(${1 - force * 0.05})`
      }}
    >
      {children}
      
      {/* Force indicator */}
      {force > 0 && (
        <div 
          className="absolute inset-0 pointer-events-none rounded-lg"
          style={{
            boxShadow: `inset 0 0 ${force * 20}px rgba(0, 0, 0, ${force * 0.2})`
          }}
        />
      )}
    </div>
  );
}

// Shake gesture detector
interface ShakeDetectorProps {
  onShake: () => void;
  threshold?: number;
  timeout?: number;
}

export function useShakeDetector({
  onShake,
  threshold = 15,
  timeout = 1000
}: ShakeDetectorProps) {
  useEffect(() => {
    let lastX = 0;
    let lastY = 0;
    let lastZ = 0;
    let lastTime = 0;
    let shakeCount = 0;

    const handleMotion = (e: DeviceMotionEvent) => {
      const current = e.accelerationIncludingGravity;
      if (!current) return;

      const currentTime = Date.now();
      if (currentTime - lastTime > 100) {
        const diffTime = currentTime - lastTime;
        const speed = Math.abs(
          (current.x! - lastX) + (current.y! - lastY) + (current.z! - lastZ)
        ) / diffTime * 10000;

        if (speed > threshold) {
          shakeCount++;
          if (shakeCount > 2) {
            onShake();
            shakeCount = 0;
            if ('vibrate' in navigator) {
              navigator.vibrate([100, 50, 100]);
            }
          }
        }

        lastX = current.x!;
        lastY = current.y!;
        lastZ = current.z!;
        lastTime = currentTime;
      }

      // Reset shake count after timeout
      setTimeout(() => {
        shakeCount = 0;
      }, timeout);
    };

    if ('DeviceMotionEvent' in window) {
      window.addEventListener('devicemotion', handleMotion);
    }

    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [onShake, threshold, timeout]);
}