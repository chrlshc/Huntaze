'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Instagram, MessageCircle, Video } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface IntegrationIconProps {
  provider: 'instagram' | 'tiktok' | 'reddit' | 'onlyfans';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-14 w-14',
  lg: 'h-20 w-20',
};

const iconSizes = {
  sm: 16,
  md: 24,
  lg: 32,
};

const providerColors = {
  instagram: '#E4405F',
  tiktok: '#000000',
  reddit: '#FF4500',
  onlyfans: '#00AFF0',
};

const providerLogos = {
  instagram: '/logos/instagram.svg',
  tiktok: '/logos/tiktok.svg',
  reddit: '/logos/reddit.svg',
  onlyfans: '/logos/onlyfans.svg',
};

// Fallback icon components
function FallbackIcon({ provider, size, color }: { provider: string; size: number; color: string }) {
  switch (provider) {
    case 'instagram':
      return <Instagram size={size} style={{ color }} className="absolute inset-0 m-auto" />;
    case 'tiktok':
      return <Video size={size} style={{ color }} className="absolute inset-0 m-auto" />;
    case 'reddit':
      return <MessageCircle size={size} style={{ color }} className="absolute inset-0 m-auto" />;
    case 'onlyfans':
      return (
        <div 
          className="absolute inset-0 m-auto flex items-center justify-center text-xs font-bold"
          style={{ color }}
        >
          OF
        </div>
      );
    default:
      return null;
  }
}

export function IntegrationIcon({ provider, size = 'md', className }: IntegrationIconProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  
  const iconSize = iconSizes[size];
  const accentColor = providerColors[provider];
  const logoPath = providerLogos[provider];

  return (
    <div
      className={cn(
        'relative grid shrink-0 place-items-center overflow-hidden rounded-xl',
        sizeClasses[size],
        className
      )}
      style={{ 
        backgroundColor: `${accentColor}15`,
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
      }}
    >
      <div className="relative h-full w-full p-2">
        {/* Show loading state */}
        {imageLoading && !imageError && (
          <div className="absolute inset-0 m-auto flex items-center justify-center">
            <div 
              className="h-4 w-4 animate-spin rounded-full border-2"
              style={{ 
                borderColor: 'var(--border-subtle)',
                borderTopColor: accentColor 
              }}
            />
          </div>
        )}
        
        {/* Try to load image, fallback to icon on error */}
        {!imageError ? (
          <Image
            src={logoPath}
            alt={`${provider} logo`}
            fill
            className="object-contain p-1"
            onError={() => {
              setImageError(true);
              setImageLoading(false);
            }}
            onLoad={() => setImageLoading(false)}
            loading="lazy"
          />
        ) : (
          <FallbackIcon provider={provider} size={iconSize} color={accentColor} />
        )}
      </div>
    </div>
  );
}
