/**
 * Adaptive Image Component
 * 
 * Automatically adjusts image quality and loading strategy based on:
 * - Connection quality
 * - Device capabilities
 * - Viewport position (above/below fold)
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useMobileOptimization } from '@/hooks/useMobileOptimization';

export interface AdaptiveImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export function AdaptiveImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className,
  onLoad,
  onError,
}: AdaptiveImageProps) {
  const { imageSettings } = useMobileOptimization();
  const imageRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(priority);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (priority || !imageRef.current) return;

    const element = imageRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [priority]);

  const handleError = (error: any) => {
    setHasError(true);
    onError?.(new Error('Image failed to load'));
  };

  const handleLoad = () => {
    onLoad?.();
  };

  // Get quality settings
  const quality = imageSettings?.quality || 85;
  const maxWidth = imageSettings?.maxWidth || 1920;

  // Calculate dimensions
  const calculatedWidth = width || maxWidth;
  const calculatedHeight = height || (width ? Math.round(width * 0.75) : Math.round(maxWidth * 0.75));

  if (hasError) {
    return (
      <div
        ref={imageRef}
        className={className}
        style={{
          width: calculatedWidth,
          height: calculatedHeight,
          backgroundColor: 'var(--bg-glass)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-tertiary)',
        }}
      >
        Failed to load image
      </div>
    );
  }

  return (
    <div ref={imageRef} className={className}>
      {isVisible ? (
        <Image
          src={src}
          alt={alt}
          width={calculatedWidth}
          height={calculatedHeight}
          quality={quality}
          loading={priority ? 'eager' : 'lazy'}
          priority={priority}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            maxWidth: '100%',
            height: 'auto',
          }}
        />
      ) : (
        <div
          style={{
            width: calculatedWidth,
            height: calculatedHeight,
            backgroundColor: 'var(--bg-glass)',
          }}
        />
      )}
    </div>
  );
}
