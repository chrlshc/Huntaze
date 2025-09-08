'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import type { ImageProps } from 'next/image';

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad'> {
  lowQualitySrc?: string;
  aspectRatio?: number;
}

export default function OptimizedImage({
  src,
  alt,
  lowQualitySrc,
  aspectRatio,
  className = '',
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!imgRef.current) return;

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
        rootMargin: '50px',
        threshold: 0.01
      }
    );

    observer.observe(imgRef.current);

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, []);

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
        <div className="absolute inset-0 skeleton-loader" />
      )}

      {/* Low quality placeholder */}
      {lowQualitySrc && !isLoaded && isInView && (
        <Image
          src={lowQualitySrc}
          alt={alt}
          fill
          className="absolute inset-0 object-cover filter blur-lg scale-110"
          priority={false}
        />
      )}

      {/* Main image */}
      {isInView && (
        <Image
          src={src}
          alt={alt}
          fill
          className={`object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setIsLoaded(true)}
          {...props}
        />
      )}
    </div>
  );
}