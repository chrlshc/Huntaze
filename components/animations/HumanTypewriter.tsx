'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface HumanTypewriterProps {
  text: string;
  className?: string;
  cursorClassName?: string;
  /** Vitesse min en ms (défaut: 30) */
  minSpeed?: number;
  /** Vitesse max en ms (défaut: 150) */
  maxSpeed?: number;
  /** Pause supplémentaire pour la ponctuation en ms (défaut: 400) */
  punctuationPause?: number;
  /** Délai avant de commencer en ms (défaut: 0) */
  startDelay?: number;
  /** Callback quand l'animation est terminée */
  onComplete?: () => void;
}

export function HumanTypewriter({
  text,
  className,
  cursorClassName,
  minSpeed = 30,
  maxSpeed = 150,
  punctuationPause = 400,
  startDelay = 0,
  onComplete,
}: HumanTypewriterProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  const getRandomDelay = useCallback(
    (char: string) => {
      const baseDelay = Math.random() * (maxSpeed - minSpeed) + minSpeed;
      const isPunctuation = ['.', ',', '!', '?', ';', ':'].includes(char);
      return isPunctuation ? baseDelay + punctuationPause : baseDelay;
    },
    [minSpeed, maxSpeed, punctuationPause]
  );

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let currentIndex = 0;

    const typeNextChar = () => {
      if (currentIndex < text.length) {
        const char = text[currentIndex];
        setDisplayedText(text.slice(0, currentIndex + 1));
        currentIndex++;
        timeoutId = setTimeout(typeNextChar, getRandomDelay(char));
      } else {
        setIsComplete(true);
        onComplete?.();
      }
    };

    // Délai initial avant de commencer
    timeoutId = setTimeout(typeNextChar, startDelay);

    return () => clearTimeout(timeoutId);
  }, [text, getRandomDelay, startDelay, onComplete]);

  return (
    <span className="inline-flex items-center">
      <span className={cn('font-mono', className)}>{displayedText}</span>
      <span
        className={cn(
          'ml-0.5 inline-block h-[1.2em] w-[3px] animate-pulse',
          'bg-cyan-400 shadow-[0_0_15px_#22d3ee]',
          isComplete && 'animate-none opacity-0',
          cursorClassName
        )}
        aria-hidden="true"
      />
    </span>
  );
}
