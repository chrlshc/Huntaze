'use client';

import React, { useState, useEffect, ReactNode, useRef } from 'react';
import { HydrationSafeWrapper } from './HydrationSafeWrapper';
import { SafeRandomContent } from './SafeRandomContent';
import { SSRDataProvider } from './SSRDataProvider';

interface SafeAnimationWrapperProps {
  children: ReactNode;
  animationConfig?: {
    delay?: number;
    duration?: number;
    easing?: string;
    randomDelay?: boolean;
    seed?: string;
  };
  fallback?: ReactNode;
  className?: string;
}

/**
 * SafeAnimationWrapper - Wrapper pour les animations hydration-safe
 * 
 * Ce composant résout les problèmes d'hydratation liés aux animations en:
 * 1. Différant les animations jusqu'après l'hydratation
 * 2. Utilisant des seeds pour les délais aléatoires cohérents
 * 3. Gérant les états d'animation de manière prévisible
 * 4. Offrant des fallbacks pendant le chargement
 */
export function SafeAnimationWrapper({
  children,
  animationConfig = {},
  fallback,
  className
}: SafeAnimationWrapperProps) {
  const [isAnimationReady, setIsAnimationReady] = useState(false);
  const [animationDelay, setAnimationDelay] = useState(0);
  const elementRef = useRef<HTMLDivElement>(null);

  const {
    delay = 0,
    duration = 300,
    easing = 'ease-in-out',
    randomDelay = false,
    seed
  } = animationConfig;

  useEffect(() => {
    // Délai avant de démarrer l'animation
    const startDelay = randomDelay ? animationDelay : delay;
    
    const timer = setTimeout(() => {
      setIsAnimationReady(true);
      
      // Appliquer l'animation CSS si l'élément existe
      if (elementRef.current) {
        elementRef.current.style.transition = `all ${duration}ms ${easing}`;
        elementRef.current.style.opacity = '1';
        elementRef.current.style.transform = 'translateY(0)';
      }
    }, startDelay);

    return () => clearTimeout(timer);
  }, [delay, duration, easing, animationDelay, randomDelay]);

  if (randomDelay && seed) {
    return (
      <SSRDataProvider hydrationId={`animation-${seed}`}>
        <SafeRandomContent seed={seed} min={0} max={1000}>
          {(randomValue) => {
            if (animationDelay === 0) {
              setAnimationDelay(randomValue);
            }
            
            return (
              <HydrationSafeWrapper fallback={fallback} className={className}>
                <div
                  ref={elementRef}
                  className={className}
                  style={{
                    opacity: isAnimationReady ? 1 : 0,
                    transform: isAnimationReady ? 'translateY(0)' : 'translateY(20px)',
                    transition: isAnimationReady ? `all ${duration}ms ${easing}` : 'none'
                  }}
                >
                  {children}
                </div>
              </HydrationSafeWrapper>
            );
          }}
        </SafeRandomContent>
      </SSRDataProvider>
    );
  }

  return (
    <HydrationSafeWrapper fallback={fallback} className={className}>
      <div
        ref={elementRef}
        className={className}
        style={{
          opacity: isAnimationReady ? 1 : 0,
          transform: isAnimationReady ? 'translateY(0)' : 'translateY(20px)',
          transition: isAnimationReady ? `all ${duration}ms ${easing}` : 'none'
        }}
      >
        {children}
      </div>
    </HydrationSafeWrapper>
  );
}

/**
 * Composant pour les particules animées de manière hydration-safe
 */
interface SafeParticleSystemProps {
  particleCount?: number;
  seed?: string;
  className?: string;
  children?: ReactNode;
}

export function SafeParticleSystem({
  particleCount = 10,
  seed = 'particles',
  className,
  children
}: SafeParticleSystemProps) {
  return (
    <SSRDataProvider hydrationId={`particles-${seed}`}>
      <SafeRandomContent seed={seed}>
        {() => (
          <div className={`relative ${className || ''}`}>
            {/* Particules de fond */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {Array.from({ length: particleCount }, (_, i) => (
                <SafeRandomContent key={i} seed={`${seed}-particle-${i}`} min={0} max={100}>
                  {(randomValue) => (
                    <div
                      className="absolute w-1 h-1 bg-blue-400 rounded-full opacity-30"
                      style={{
                        left: `${randomValue}%`,
                        top: `${(randomValue * 1.5) % 100}%`,
                        animationDelay: `${(randomValue * 10) % 3000}ms`,
                        animation: 'float 6s ease-in-out infinite'
                      }}
                    />
                  )}
                </SafeRandomContent>
              ))}
            </div>
            
            {/* Contenu principal */}
            <div className="relative z-10">
              {children}
            </div>
            
            {/* Styles CSS pour l'animation */}
            <style jsx>{`
              @keyframes float {
                0%, 100% { transform: translateY(0px) rotate(0deg); }
                50% { transform: translateY(-20px) rotate(180deg); }
              }
            `}</style>
          </div>
        )}
      </SafeRandomContent>
    </SSRDataProvider>
  );
}

/**
 * Hook pour les animations basées sur le scroll de manière hydration-safe
 */
export function useScrollAnimation(threshold = 0.1) {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          setIsVisible(entry.isIntersecting);
        },
        { threshold }
      );

      const currentElement = elementRef.current;

      if (currentElement) {
        observer.observe(currentElement);
      }

      return () => {
        if (currentElement) {
          observer.unobserve(currentElement);
        }
      };
    }
  }, [threshold]);

  return { isVisible, elementRef };
}

/**
 * Composant pour les animations au scroll de manière hydration-safe
 */
interface SafeScrollAnimationProps {
  children: (isVisible: boolean) => ReactNode;
  threshold?: number;
  className?: string;
  fallback?: ReactNode;
}

export function SafeScrollAnimation({
  children,
  threshold = 0.1,
  className,
  fallback
}: SafeScrollAnimationProps) {
  const { isVisible, elementRef } = useScrollAnimation(threshold);

  return (
    <HydrationSafeWrapper fallback={fallback}>
      <div ref={elementRef as React.RefObject<HTMLDivElement>} className={className}>
        {children(isVisible)}
      </div>
    </HydrationSafeWrapper>
  );
}

/**
 * Composant pour les effets de typing de manière hydration-safe
 */
interface SafeTypingEffectProps {
  text: string;
  speed?: number;
  seed?: string;
  className?: string;
}

export function SafeTypingEffect({
  text,
  speed = 50,
  seed = 'typing',
  className
}: SafeTypingEffectProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!isTyping) {
      setIsTyping(true);
      let currentIndex = 0;
      
      const timer = setInterval(() => {
        if (currentIndex < text.length) {
          setDisplayedText(text.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          clearInterval(timer);
          setIsTyping(false);
        }
      }, speed);

      return () => clearInterval(timer);
    }
  }, [text, speed, isTyping]);

  return (
    <SSRDataProvider hydrationId={`typing-${seed}`}>
      <HydrationSafeWrapper>
        <span className={className}>
          {displayedText}
          {isTyping && <span className="animate-pulse">|</span>}
        </span>
      </HydrationSafeWrapper>
    </SSRDataProvider>
  );
}
