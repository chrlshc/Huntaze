/**
 * TailAdmin Card Component
 * Wrapper component following TailAdmin design patterns
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface TailAdminCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: boolean;
}

export function TailAdminCard({ 
  children, 
  className,
  padding = 'md',
  shadow = true 
}: TailAdminCardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  return (
    <div
      className={cn(
        'tailadmin-card rounded-[var(--tailadmin-radius-lg)] bg-white border border-stroke',
        shadow && 'shadow-card',
        paddingClasses[padding],
        className
      )}
      style={{
        backgroundColor: 'var(--tailadmin-card-bg)',
        borderColor: 'var(--tailadmin-border-color)',
        boxShadow: shadow ? 'var(--tailadmin-shadow-card)' : 'none'
      }}
    >
      {children}
    </div>
  );
}

interface TailAdminCardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function TailAdminCardHeader({ children, className }: TailAdminCardHeaderProps) {
  return (
    <div 
      className={cn('mb-4 pb-4 border-b', className)}
      style={{ borderColor: 'var(--tailadmin-border-color)' }}
    >
      {children}
    </div>
  );
}

interface TailAdminCardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function TailAdminCardTitle({ children, className }: TailAdminCardTitleProps) {
  return (
    <h3 
      className={cn('text-xl font-semibold', className)}
      style={{ 
        color: 'var(--tailadmin-text-primary)',
        fontWeight: 'var(--tailadmin-font-weight-semibold)'
      }}
    >
      {children}
    </h3>
  );
}

interface TailAdminCardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function TailAdminCardContent({ children, className }: TailAdminCardContentProps) {
  return (
    <div className={cn('', className)}>
      {children}
    </div>
  );
}
