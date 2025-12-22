/**
 * Date Separator Component
 * 
 * Displays date labels between message groups:
 * - "Aujourd'hui" for today
 * - "Hier" for yesterday
 * - Full date for older messages
 * 
 * Based on SPEC-FINALE-SAAS-LEVEL.md - Phase 10
 */

import React from 'react';
import './date-separator.css';

export interface DateSeparatorProps {
  label: string;
  className?: string;
}

export const DateSeparator: React.FC<DateSeparatorProps> = ({ 
  label, 
  className = '' 
}) => {
  return (
    <div className={`date-separator ${className}`} role="separator" aria-label={`Messages du ${label}`}>
      <span className="date-separator__chip">{label}</span>
    </div>
  );
};

export default DateSeparator;
