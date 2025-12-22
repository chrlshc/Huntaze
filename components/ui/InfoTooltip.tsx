'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

export interface InfoTooltipProps {
  title: string;
  description: string;
  whyItMatters?: string;
  tip?: string;
  showMeHow?: () => void;
}

export function InfoTooltip({ 
  title, 
  description, 
  whyItMatters, 
  tip,
  showMeHow 
}: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        tooltipRef.current && 
        !tooltipRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative inline-flex">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
        aria-label={`Info about ${title}`}
      >
        <Info className="w-4 h-4" />
      </button>

      {isOpen && (
        <div
          ref={tooltipRef}
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700"
          role="tooltip"
        >
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
              {title}
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {description}
            </p>
            {whyItMatters && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-medium">Why it matters:</span> {whyItMatters}
                </p>
              </div>
            )}
            {tip && (
              <div className="pt-2">
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  <span className="font-medium">Tip:</span> {tip}
                </p>
              </div>
            )}
            {showMeHow && (
              <button
                onClick={showMeHow}
                className="mt-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                Show me how →
              </button>
            )}
          </div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-white dark:bg-slate-800 border-r border-b border-slate-200 dark:border-slate-700" />
        </div>
      )}
    </div>
  );
}

export default InfoTooltip;
