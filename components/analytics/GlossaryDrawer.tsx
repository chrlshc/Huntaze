'use client';

import React, { useState, useMemo } from 'react';
import { X, Search, ChevronRight, Lightbulb, BookOpen } from 'lucide-react';
import { GLOSSARY, searchGlossary, type GlossaryEntry } from '@/lib/analytics/glossary';

interface GlossaryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<GlossaryEntry['category'], string> = {
  revenue: 'Revenue',
  retention: 'Retention',
  acquisition: 'Acquisition',
  engagement: 'Engagement',
  risk: 'Risk',
  messaging: 'Messaging'
};

const CATEGORY_COLORS: Record<GlossaryEntry['category'], string> = {
  revenue: '#008060',
  retention: '#5C6AC4',
  acquisition: '#007ACE',
  engagement: '#9C6ADE',
  risk: '#D72C0D',
  messaging: '#00A0AC'
};

/**
 * GlossaryDrawer - Level 3 progressive disclosure
 * 
 * Searchable panel with all KPI definitions.
 * Opens from the right side of the screen.
 */
export function GlossaryDrawer({ isOpen, onClose }: GlossaryDrawerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) {
      return Object.values(GLOSSARY);
    }
    return searchGlossary(searchQuery);
  }, [searchQuery]);

  const groupedEntries = useMemo(() => {
    const groups: Record<GlossaryEntry['category'], GlossaryEntry[]> = {
      revenue: [],
      retention: [],
      acquisition: [],
      engagement: [],
      risk: [],
      messaging: []
    };
    
    filteredEntries.forEach(entry => {
      groups[entry.category].push(entry);
    });
    
    return groups;
  }, [filteredEntries]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="glossary-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Drawer */}
      <div 
        className="glossary-drawer"
        role="dialog"
        aria-label="Metrics glossary"
        aria-modal="true"
      >
        {/* Header */}
        <div className="glossary-header">
          <div className="glossary-header-title">
            <BookOpen size={20} />
            <h2>Glossary</h2>
          </div>
          <button 
            className="glossary-close"
            onClick={onClose}
            aria-label="Close glossary"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="glossary-search">
          <Search size={16} className="glossary-search-icon" />
          <input
            type="text"
            placeholder="Search a term..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glossary-search-input"
            autoFocus
          />
          {searchQuery && (
            <button 
              className="glossary-search-clear"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="glossary-content">
          {filteredEntries.length === 0 ? (
            <div className="glossary-empty">
              <p>No results for "{searchQuery}"</p>
            </div>
          ) : (
            Object.entries(groupedEntries).map(([category, entries]) => {
              if (entries.length === 0) return null;
              
              return (
                <div key={category} className="glossary-category">
                  <h3 
                    className="glossary-category-title"
                    style={{ color: CATEGORY_COLORS[category as GlossaryEntry['category']] }}
                  >
                    {CATEGORY_LABELS[category as GlossaryEntry['category']]}
                  </h3>
                  
                  <div className="glossary-entries">
                    {entries.map(entry => (
                      <div 
                        key={entry.id}
                        className={`glossary-entry ${expandedId === entry.id ? 'expanded' : ''}`}
                      >
                        <button
                          className="glossary-entry-header"
                          onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                          aria-expanded={expandedId === entry.id}
                        >
                          <span className="glossary-entry-label">
                            {entry.labelFriendly || entry.label}
                          </span>
                          <ChevronRight 
                            size={16} 
                            className={`glossary-entry-chevron ${expandedId === entry.id ? 'rotated' : ''}`}
                          />
                        </button>
                        
                        {expandedId === entry.id && (
                          <div className="glossary-entry-content">
                            <p className="glossary-entry-tooltip">{entry.tooltip}</p>
                            
                            <div className="glossary-entry-section">
                              <span className="glossary-entry-section-label">Definition</span>
                              <p>{entry.definition}</p>
                            </div>
                            
                            <div className="glossary-entry-section">
                              <span className="glossary-entry-section-label">Why it matters</span>
                              <p>{entry.whyImportant}</p>
                            </div>
                            
                            <div className="glossary-entry-section glossary-entry-example">
                              <span className="glossary-entry-section-label">Example</span>
                              <p>{entry.example}</p>
                            </div>
                            
                            <div className="glossary-entry-section">
                              <span className="glossary-entry-section-label">
                                <Lightbulb size={12} />
                                How to improve
                              </span>
                              <ul className="glossary-entry-tips">
                                {entry.howToImprove.map((tip, i) => (
                                  <li key={i}>{tip}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <style jsx>{`
        .glossary-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          z-index: 1100;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .glossary-drawer {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: 400px;
          max-width: 100vw;
          background: #FFFFFF;
          z-index: 1101;
          display: flex;
          flex-direction: column;
          box-shadow: -4px 0 24px rgba(0, 0, 0, 0.12);
          animation: slideIn 0.25s ease;
        }

        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }

        .glossary-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid #E3E3E3;
          background: #FAFAFA;
        }

        .glossary-header-title {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #303030;
        }

        .glossary-header-title h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }

        .glossary-close {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
          border: none;
          background: transparent;
          color: #616161;
          cursor: pointer;
          border-radius: 6px;
          transition: background-color 0.15s ease;
        }

        .glossary-close:hover {
          background: #E3E3E3;
        }

        .glossary-search {
          position: relative;
          padding: 12px 20px;
          border-bottom: 1px solid #E3E3E3;
        }

        .glossary-search-icon {
          position: absolute;
          left: 32px;
          top: 50%;
          transform: translateY(-50%);
          color: #8C8C8C;
          pointer-events: none;
        }

        .glossary-search-input {
          width: 100%;
          padding: 10px 36px 10px 36px;
          border: 1px solid #C9CCCF;
          border-radius: 8px;
          font-size: 14px;
          color: #303030;
          background: #FFFFFF;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .glossary-search-input:focus {
          outline: none;
          border-color: #005BD3;
          box-shadow: 0 0 0 2px rgba(0, 91, 211, 0.2);
        }

        .glossary-search-input::placeholder {
          color: #8C8C8C;
        }

        .glossary-search-clear {
          position: absolute;
          right: 32px;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          border: none;
          background: #E3E3E3;
          color: #616161;
          cursor: pointer;
          border-radius: 50%;
          transition: background-color 0.15s ease;
        }

        .glossary-search-clear:hover {
          background: #C9CCCF;
        }

        .glossary-content {
          flex: 1;
          overflow-y: auto;
          padding: 16px 20px;
        }

        .glossary-empty {
          text-align: center;
          padding: 40px 20px;
          color: #616161;
        }

        .glossary-category {
          margin-bottom: 24px;
        }

        .glossary-category:last-child {
          margin-bottom: 0;
        }

        .glossary-category-title {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 8px 0;
        }

        .glossary-entries {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .glossary-entry {
          background: #FAFAFA;
          border-radius: 8px;
          overflow: hidden;
          transition: background-color 0.15s ease;
        }

        .glossary-entry:hover {
          background: #F1F1F1;
        }

        .glossary-entry.expanded {
          background: #FFFFFF;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        }

        .glossary-entry-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 12px 14px;
          border: none;
          background: transparent;
          cursor: pointer;
          text-align: left;
          font-size: 14px;
          color: #303030;
        }

        .glossary-entry-label {
          font-weight: 500;
        }

        .glossary-entry-chevron {
          color: #8C8C8C;
          transition: transform 0.2s ease;
          flex-shrink: 0;
        }

        .glossary-entry-chevron.rotated {
          transform: rotate(90deg);
        }

        .glossary-entry-content {
          padding: 0 14px 14px 14px;
          font-size: 13px;
          line-height: 1.5;
          color: #303030;
          animation: expandIn 0.2s ease;
        }

        @keyframes expandIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .glossary-entry-tooltip {
          margin: 0 0 12px 0;
          padding: 10px 12px;
          background: #303030;
          color: #FFFFFF;
          border-radius: 6px;
          font-size: 12px;
        }

        .glossary-entry-section {
          margin-bottom: 12px;
        }

        .glossary-entry-section:last-child {
          margin-bottom: 0;
        }

        .glossary-entry-section-label {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #616161;
          margin-bottom: 4px;
        }

        .glossary-entry-section p {
          margin: 0;
        }

        .glossary-entry-example {
          background: #F7F7F7;
          padding: 10px 12px;
          border-radius: 6px;
          margin-left: -4px;
          margin-right: -4px;
        }

        .glossary-entry-example p {
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
          font-size: 12px;
        }

        .glossary-entry-tips {
          margin: 0;
          padding: 0 0 0 16px;
          list-style: disc;
        }

        .glossary-entry-tips li {
          margin-bottom: 4px;
        }

        .glossary-entry-tips li:last-child {
          margin-bottom: 0;
        }

        @media (max-width: 480px) {
          .glossary-drawer {
            width: 100vw;
          }
        }
      `}</style>
    </>
  );
}

export default GlossaryDrawer;
