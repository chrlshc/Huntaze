'use client';

import { useEffect, useState } from 'react';
import { getTimeTip, type PageName } from '@/lib/tips/butler-tips';

interface ButlerTipProps {
  page: PageName;
  className?: string;
}

export function ButlerTip({ page, className = '' }: ButlerTipProps) {
  const [tip, setTip] = useState<string>('');

  useEffect(() => {
    // Get time-based tip that changes hourly
    setTip(getTimeTip(page));
  }, [page]);

  if (!tip) return null;

  return (
    <div 
      className={className}
      style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        borderRadius: 8,
        padding: 12,
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start',
      }}
    >
      <img 
        src="/butler.svg" 
        alt="Majordome" 
        style={{
          width: 24,
          height: 24,
          borderRadius: 4,
          flexShrink: 0,
        }}
      />
      <p style={{ 
        margin: 0, 
        fontSize: 13, 
        color: '#e5e7eb',
        lineHeight: 1.5,
      }}>
        <strong style={{ color: 'white' }}>Tip:</strong> {tip}
      </p>
    </div>
  );
}
