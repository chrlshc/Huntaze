/**
 * TailAdmin Avatar Component
 * Wrapper component following TailAdmin design patterns
 */

import React from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface TailAdminAvatarProps {
  src?: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'away' | 'busy';
  fallback?: string;
  className?: string;
}

export function TailAdminAvatar({ 
  src, 
  alt = 'Avatar',
  size = 'md',
  status,
  fallback,
  className 
}: TailAdminAvatarProps) {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl'
  };

  const statusColors = {
    online: 'bg-success',
    offline: 'bg-body',
    away: 'bg-warning',
    busy: 'bg-danger'
  };

  const statusSize = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4'
  };

  return (
    <div className={cn('relative inline-block', className)}>
      <div 
        className={cn(
          'rounded-full overflow-hidden flex items-center justify-center',
          sizeClasses[size],
          !src && 'bg-gray-2'
        )}
        style={{
          backgroundColor: !src ? 'var(--tailadmin-gray-2)' : undefined
        }}
      >
        {src ? (
          <Image
            src={src}
            alt={alt}
            width={size === 'xs' ? 24 : size === 'sm' ? 32 : size === 'md' ? 40 : size === 'lg' ? 48 : 64}
            height={size === 'xs' ? 24 : size === 'sm' ? 32 : size === 'md' ? 40 : size === 'lg' ? 48 : 64}
            className="object-cover w-full h-full"
          />
        ) : (
          <span 
            className="font-medium uppercase"
            style={{ color: 'var(--tailadmin-text-secondary)' }}
          >
            {fallback || alt.charAt(0)}
          </span>
        )}
      </div>
      {status && (
        <span 
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-white',
            statusColors[status],
            statusSize[size]
          )}
          style={{
            backgroundColor: `var(--tailadmin-${status === 'online' ? 'success' : status === 'offline' ? 'body' : status === 'away' ? 'warning' : 'danger'})`
          }}
        />
      )}
    </div>
  );
}
