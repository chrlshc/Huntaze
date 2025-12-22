'use client';

import { ReactNode } from 'react';

interface PolarisCardProps {
  children: ReactNode;
  className?: string;
}

interface PolarisCardHeaderProps {
  title: string;
  actions?: ReactNode;
}

interface PolarisCardSectionProps {
  children: ReactNode;
  flush?: boolean;
}

export function PolarisCard({ children, className = '' }: PolarisCardProps) {
  return (
    <div
      className={className}
      style={{
        backgroundColor: 'rgba(255, 255, 255, 1)',
        borderRadius: '8px',
        boxShadow: '0px 4px 6px -2px rgba(26, 26, 26, 0.20)',
        border: '1px solid rgba(227, 227, 227, 1)',
      }}
    >
      {children}
    </div>
  );
}

export function PolarisCardHeader({ title, actions }: PolarisCardHeaderProps) {
  return (
    <div 
      className="flex items-center justify-between"
      style={{
        padding: '12px 16px',
        borderBottom: '1px solid rgba(235, 235, 235, 1)',
      }}
    >
      <h2 
        style={{
          fontSize: '14px',
          fontWeight: 600,
          color: 'rgba(48, 48, 48, 1)',
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        }}
      >
        {title}
      </h2>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function PolarisCardSection({ children, flush = false }: PolarisCardSectionProps) {
  return (
    <div style={{ padding: flush ? 0 : '16px' }}>
      {children}
    </div>
  );
}
