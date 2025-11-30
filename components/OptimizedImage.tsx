'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import type { ImageProps } from 'next/image';

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad' | 'src' | 'sizes'> {
  src: string;
  lowQualitySrc?: string;
  aspectRatio?: number;
  formats?: {
    avif?: string;
    webp?: string;
    jpeg?: string;
  };
  sizes?: {
    thumbnail?: string;
    medium?: string;
    large?: string;
  };
  preferredFormat?: 'avif' | 'webp' | 'jpeg';
  preferredSize?: 'thumbnail' | 'medium' | 'large';
  enableLazyLoading?: boolean;
}

/**
 * Enhanced OptimizedImage component with multi-format support and CloudFront integration
 * 
 * Features:
 * - Multi-format support (AVIF, WebP, JPEG) with automatic fallback
 * - Multiple size variants (thumbnail, medium, large)
 * - Lazy loading with Intersection Observer
 * - Low-quality placeholder (LQIP) support
 * - Skeleton loading state
 * - CloudFront CDN integration
 */
export default function OptimizedImage({
  src,
  alt,
  lowQualitySrc,
  aspectRatio,
  formats,
  sizes,
  preferredFormat = 'avif',
  preferredSize = 'medium',
  enableLazyLoading = true,
  className = '',
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(!enableLazyLoading);
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const imgRef = useRef<HTMLDivElement>(null);

  // Determine the best image source based on format support and availability
  useEffect(() => {
    if (!isInView) return;

    const selectBestSource = () => {
      // If formats are provided, use them with fallback chain
      if (formats) {
        // Try preferred format first
        if (preferredFormat === 'avif' && formats.avif) return formats.avif;
        if (preferredFormat === 'webp' && formats.webp) return formats.webp;
        if (preferredFormat === 'jpeg' && formats.jpeg) return formats.jpeg;

        // Fallback chain: AVIF -> WebP -> JPEG
        if (formats.avif) return formats.avif;
        if (formats.webp) return formats.webp;
        if (formats.jpeg) return formats.jpeg;
      }

      // If sizes are provided, use preferred size
      if (sizes) {
        if (preferredSize === 'thumbnail' && sizes.thumbnail) return sizes.thumbnail;
        if (preferredSize === 'medium' && sizes.medium) return sizes.medium;
        if (preferredSize === 'large' && sizes.large) return sizes.large;

        // Fallback to any available size
        if (sizes.medium) return sizes.medium;
        if (sizes.large) return sizes.large;
        if (sizes.thumbnail) return sizes.thumbnail;
      }

      // Default to provided src
      return src;
    };

    setCurrentSrc(selectBestSource());
  }, [isInView, src, formats, sizes, preferredFormat, preferredSize]);

  // Lazy loading with Intersection Observer
  useEffect(() => {
    if (!enableLazyLoading || !imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
        threshold: 0.01,
      }
    );

    observer.observe(imgRef.current);

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [enableLazyLoading]);

  const containerStyle = aspectRatio
    ? { aspectRatio: `${aspectRatio}`, width: '100%' }
    : {};

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={containerStyle}
    >
      {/* Skeleton loader */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}

      {/* Low quality placeholder (LQIP) */}
      {lowQualitySrc && !isLoaded && isInView && (
        <Image
          src={lowQualitySrc}
          alt={alt}
          fill
          className="absolute inset-0 object-cover filter blur-lg scale-110"
          priority={false}
        />
      )}

      {/* Main image with format fallback */}
      {isInView && currentSrc && (
        <picture>
          {/* AVIF format - best compression */}
          {formats?.avif && (
            <source srcSet={formats.avif} type="image/avif" />
          )}
          
          {/* WebP format - good compression, wide support */}
          {formats?.webp && (
            <source srcSet={formats.webp} type="image/webp" />
          )}
          
          {/* JPEG format - universal fallback */}
          {formats?.jpeg && (
            <source srcSet={formats.jpeg} type="image/jpeg" />
          )}

          <Image
            src={currentSrc}
            alt={alt}
            fill
            className={`object-cover transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setIsLoaded(true)}
            loading={enableLazyLoading ? 'lazy' : 'eager'}
            {...props}
          />
        </picture>
      )}
    </div>
  );
}

/**
 * Helper function to generate CloudFront URLs with transformations
 */
export function generateCDNUrl(
  baseUrl: string,
  options?: {
    width?: number;
    height?: number;
    format?: 'avif' | 'webp' | 'jpeg';
    quality?: number;
  }
): string {
  if (!options) return baseUrl;

  const url = new URL(baseUrl);
  const params = new URLSearchParams();

  if (options.width) params.append('w', options.width.toString());
  if (options.height) params.append('h', options.height.toString());
  if (options.format) params.append('f', options.format);
  if (options.quality) params.append('q', options.quality.toString());

  if (params.toString()) {
    url.search = params.toString();
  }

  return url.toString();
}
