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

export function IntegrationIcon({ provider, size = 'md', className }: IntegrationIconProps) {
  const iconSize = iconSizes[size];
  const accentColor = providerColors[provider];
  const logoPath = providerLogos[provider];

  return (
    <div
      className={cn(
        'relative grid shrink-0 place-items-center overflow-hidden rounded-xl border border-border-subtle bg-surface-muted',
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor: `${accentColor}15` }}
    >
      {/* Try to use logo image first, fallback to icon */}
      <div className="relative h-full w-full p-2">
        {provider === 'instagram' && (
          <Instagram size={iconSize} style={{ color: accentColor }} className="absolute inset-0 m-auto" />
        )}
        {provider === 'tiktok' && (
          <Video size={iconSize} style={{ color: accentColor }} className="absolute inset-0 m-auto" />
        )}
        {provider === 'reddit' && (
          <MessageCircle size={iconSize} style={{ color: accentColor }} className="absolute inset-0 m-auto" />
        )}
        {provider === 'onlyfans' && (
          <div 
            className="absolute inset-0 m-auto flex items-center justify-center text-xs font-bold"
            style={{ color: accentColor }}
          >
            OF
          </div>
        )}
      </div>
    </div>
  );
}
