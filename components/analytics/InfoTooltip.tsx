'use client';

import React, { useState, useRef, useEffect, useId } from 'react';
import { Info, X, ChevronRight, Lightbulb } from 'lucide-react';
import { getGlossaryEntry, type GlossaryEntry } from '@/lib/analytics/glossary';

// Custom event to close all other popovers
const CLOSE_ALL_POPOVERS_EVENT = 'infotooltip:closeall';

interface InfoTooltipProps {
  glossaryId: string;
  size?: number;
  showPopover?: boolean;
}

/**
 * InfoTooltip - Progressive disclosure component
 * 
 * Level 1: Hover/focus shows tooltip (1-2 lines)
 * Level 2: Click opens popover with full explanation
 * 
 * Follows Polaris design patterns for tooltips/popovers.
 */
export function InfoTooltip({ glossaryId, size = 14, showPopover = true }: InfoTooltipProps) {
  const instanceId = useId();
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  
  const entry = getGlossaryEntry(glossaryId);
  
  if (!entry) {
    console.warn(`InfoTooltip: No glossary entry found for "${glossaryId}"`);
    return null;
  }

  // Listen for close-all event from other instances
  useEffect(() => {
    function handleCloseAll(event: CustomEvent<string>) {
      // Close this popover if another instance triggered the event
      if (event.detail !== instanceId) {
        setIsPopoverOpen(false);
      }
    }

    document.addEventListener(CLOSE_ALL_POPOVERS_EVENT, handleCloseAll as EventListener);
    return () => document.removeEventListener(CLOSE_ALL_POPOVERS_EVENT, handleCloseAll as EventListener);
  }, [instanceId]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current && 
        !popoverRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsPopoverOpen(false);
      }
    }

    function handleScroll() {
      setIsPopoverOpen(false);
    }

    if (isPopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [isPopoverOpen]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showPopover && buttonRef.current) {
      const willOpen = !isPopoverOpen;
      
      if (willOpen) {
        // Close all other popovers first
        document.dispatchEvent(new CustomEvent(CLOSE_ALL_POPOVERS_EVENT, { detail: instanceId }));
        
        // Calculate position BEFORE opening to avoid jump
        const rect = buttonRef.current.getBoundingClientRect();
        const popoverWidth = 300;
        const popoverHeight = 350;
        const margin = 12;
        
        let left = rect.left + rect.width / 2 - popoverWidth / 2;
        if (left < margin) left = margin;
        if (left + popoverWidth > window.innerWidth - margin) {
          left = window.innerWidth - popoverWidth - margin;
        }
        
        const spaceBelow = window.innerHeight - rect.bottom;
        let top: number;
        if (spaceBelow >= popoverHeight + margin) {
          top = rect.bottom + 8;
        } else {
          top = rect.top - popoverHeight - 8;
          if (top < margin) top = margin;
        }
        
        setPopoverStyle({ top, left });
      }
      
      setIsPopoverOpen(willOpen);
      setIsTooltipVisible(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e as unknown as React.MouseEvent);
    }
    if (e.key === 'Escape' && isPopoverOpen) {
      setIsPopoverOpen(false);
    }
  };

  return (
    <span className="info-tooltip-wrapper">
      <button
        ref={buttonRef}
        type="button"
        className="info-tooltip-trigger"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => {
          if (!isPopoverOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setTooltipStyle({
              position: 'fixed',
              left: rect.left + rect.width / 2,
              top: rect.top - 8,
              transform: 'translateX(-50%) translateY(-100%)'
            });
            setIsTooltipVisible(true);
          }
        }}
        onMouseLeave={() => setIsTooltipVisible(false)}
        onFocus={() => {
          if (!isPopoverOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setTooltipStyle({
              position: 'fixed',
              left: rect.left + rect.width / 2,
              top: rect.top - 8,
              transform: 'translateX(-50%) translateY(-100%)'
            });
            setIsTooltipVisible(true);
          }
        }}
        onBlur={() => setIsTooltipVisible(false)}
        aria-label={`Info about ${entry.label}`}
        aria-expanded={isPopoverOpen}
        aria-haspopup={showPopover ? 'dialog' : undefined}
      >
        <Info size={size} />
      </button>

      {/* Level 1: Tooltip */}
      {isTooltipVisible && !isPopoverOpen && (
        <div className="info-tooltip" style={tooltipStyle} role="tooltip">
          <div className="info-tooltip-content">
            {entry.tooltip}
          </div>
          <div className="info-tooltip-arrow" />
        </div>
      )}

      {/* Level 2: Popover */}
      {isPopoverOpen && showPopover && (
        <div 
          ref={popoverRef}
          className="info-popover"
          style={popoverStyle}
          role="dialog"
          aria-labelledby={`popover-title-${glossaryId}`}
        >
          <div className="info-popover-header">
            <h4 id={`popover-title-${glossaryId}`} className="info-popover-title">
              {entry.labelFriendly || entry.label}
            </h4>
            <button 
              className="info-popover-close"
              onClick={() => setIsPopoverOpen(false)}
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
          
          <div className="info-popover-body">
            <p className="info-popover-definition">{entry.definition}</p>
            
            <div className="info-popover-section">
              <span className="info-popover-label">Why it matters</span>
              <p>{entry.whyImportant}</p>
            </div>
            
            <div className="info-popover-section info-popover-example">
              <span className="info-popover-label">Example</span>
              <p>{entry.example}</p>
            </div>
            
            <div className="info-popover-section">
              <span className="info-popover-label">
                <Lightbulb size={12} style={{ marginRight: 4 }} />
                How to improve
              </span>
              <ul className="info-popover-tips">
                {entry.howToImprove.map((tip, i) => (
                  <li key={i}>
                    <ChevronRight size={12} />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .info-tooltip-wrapper {
          position: relative;
          display: inline-flex;
          align-items: center;
          margin-left: 4px;
        }

        .info-tooltip-trigger {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 2px;
          border: none;
          background: transparent;
          color: #8C8C8C;
          cursor: pointer;
          border-radius: 50%;
          transition: color 0.15s ease, background-color 0.15s ease;
        }

        .info-tooltip-trigger:hover,
        .info-tooltip-trigger:focus {
          color: #303030;
          background-color: rgba(0, 0, 0, 0.05);
          outline: none;
        }

        .info-tooltip-trigger:focus-visible {
          box-shadow: 0 0 0 2px #005BD3;
        }

        /* Tooltip */
        .info-tooltip {
          z-index: 9999;
          width: max-content;
          max-width: 200px;
          padding: 6px 10px;
          background: #303030;
          color: #FFFFFF;
          font-size: 12px;
          line-height: 1.35;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          pointer-events: none;
          white-space: normal;
          word-wrap: break-word;
        }

        .info-tooltip-content {
          text-align: left;
        }

        .info-tooltip-arrow {
          position: absolute;
          bottom: -3px;
          left: 50%;
          transform: translateX(-50%) rotate(45deg);
          width: 6px;
          height: 6px;
          background: #303030;
        }

        /* Popover */
        .info-popover {
          position: fixed;
          z-index: 9999;
          width: 300px;
          max-width: calc(100vw - 32px);
          background: #FFFFFF;
          border-radius: 8px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.08);
        }


        .info-popover-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-bottom: 1px solid #E3E3E3;
        }

        .info-popover-title {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #303030;
        }

        .info-popover-close {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          border: none;
          background: transparent;
          color: #616161;
          cursor: pointer;
          border-radius: 4px;
          transition: background-color 0.15s ease;
        }

        .info-popover-close:hover {
          background-color: #F1F1F1;
        }

        .info-popover-body {
          padding: 12px 14px;
          font-size: 12px;
          line-height: 1.5;
          color: #303030;
          max-height: 320px;
          overflow-y: auto;
        }

        .info-popover-definition {
          margin: 0 0 10px 0;
          color: #303030;
        }

        .info-popover-section {
          margin-bottom: 10px;
        }

        .info-popover-section:last-child {
          margin-bottom: 0;
        }

        .info-popover-label {
          display: flex;
          align-items: center;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #616161;
          margin-bottom: 3px;
        }

        .info-popover-section p {
          margin: 0;
          color: #303030;
        }

        .info-popover-example {
          background: #F7F7F7;
          padding: 8px 10px;
          border-radius: 4px;
          margin-left: -2px;
          margin-right: -2px;
        }

        .info-popover-example p {
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
          font-size: 12px;
        }

        .info-popover-tips {
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .info-popover-tips li {
          display: flex;
          align-items: flex-start;
          gap: 4px;
          margin-bottom: 4px;
          color: #303030;
          font-size: 11px;
        }

        .info-popover-tips li:last-child {
          margin-bottom: 0;
        }

        .info-popover-tips li svg {
          flex-shrink: 0;
          margin-top: 2px;
          color: #008060;
        }

        /* Mobile adjustments */
        @media (max-width: 480px) {
          .info-popover {
            position: fixed;
            left: 16px;
            right: 16px;
            bottom: 16px;
            top: auto;
            transform: none;
            width: auto;
            max-height: 60vh;
          }

          .info-popover-body {
            max-height: calc(60vh - 60px);
          }
        }
      `}</style>
    </span>
  );
}

export default InfoTooltip;
