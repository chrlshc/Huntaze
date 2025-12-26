/**
 * Optimized Image Component
 * 
 * Implements lazy loading, responsive images, and proper sizing
 * to improve LCP and reduce CLS
 * 
 * Requirements: 9.5
 * Property 20: Core Web Vitals Performance
 */

'use client';

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { createLazyLoader } from '@/lib/performance/onlyfans-optimization';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  sizes?: string;
  fill?: boolean;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  onLoad?: () => void;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
}

/**
 * Optimized Image with lazy loading and proper sizing
 * Reduces CLS by reserving space and improves LCP with priority loading
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className = '',
  sizes,
  fill = false,
  objectFit = 'cover',
  onLoad,
  placeholder = 'empty',
  blurDataURL,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(priority);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority || shouldLoad) return;

    // Set up intersection observer for lazy loading
    const observer = createLazyLoader(() => {
      setShouldLoad(true);
    });

    const currentElement = imgRef.current;

    if (observer && currentElement) {
      observer.observe(currentElement);
    }

    return () => {
      if (observer && currentElement) {
        observer.unobserve(currentElement);
      }
    };
  }, [priority, shouldLoad]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  // Calculate aspect ratio for proper space reservation
  const aspectRatio = width && height ? (height / width) * 100 : undefined;

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        ...(aspectRatio && !fill ? { paddingBottom: `${aspectRatio}%` } : {}),
        ...(width && !fill ? { width: `${width}px` } : {}),
        ...(height && !fill ? { height: `${height}px` } : {}),
      }}
    >
      {shouldLoad ? (
        <Image
          src={src}
          alt={alt}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          fill={fill}
          priority={priority}
          sizes={sizes}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${fill ? 'object-cover' : ''}`}
          style={fill ? { objectFit } : undefined}
          onLoad={handleLoad}
          placeholder={placeholder}
          blurDataURL={blurDataURL}
          loading={priority ? 'eager' : 'lazy'}
        />
      ) : (
        // Placeholder while waiting to load
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
    </div>
  );
}

/**
 * Avatar image with optimized loading
 */
export function OptimizedAvatar({
  src,
  alt,
  size = 40,
  className = '',
}: {
  src: string;
  alt: string;
  size?: number;
  className?: string;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full ${className}`}
      sizes={`${size}px`}
    />
  );
}

/**
 * Thumbnail image with optimized loading
 */
export function OptimizedThumbnail({
  src,
  alt,
  width = 200,
  height = 150,
  className = '',
}: {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={`rounded-lg ${className}`}
      sizes={`(max-width: 768px) 100vw, ${width}px`}
    />
  );
}

/**
 * Hero image with priority loading
 */
export function OptimizedHeroImage({
  src,
  alt,
  className = '',
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      fill
      priority
      className={className}
      sizes="100vw"
      objectFit="cover"
    />
  );
}
