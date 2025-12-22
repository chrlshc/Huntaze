/**
 * TemplateCard Component
 * Feature: onlyfans-settings-saas-transformation
 * Requirements: 3.2, 3.4
 * 
 * Visual template card with menu actions for the Templates section.
 * Displays template category, title, preview, and action menu.
 */

'use client';

import { useState } from 'react';
import { MoreVertical, Edit, Copy, Trash2 } from 'lucide-react';

export interface TemplateCardProps {
  id: string;
  category: string;
  title: string;
  preview: string;
  usageCount?: number;
  onEdit?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function TemplateCard({
  id,
  category,
  title,
  preview,
  usageCount,
  onEdit,
  onDuplicate,
  onDelete,
}: TemplateCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleEdit = () => {
    setShowMenu(false);
    onEdit?.(id);
  };

  const handleDuplicate = () => {
    setShowMenu(false);
    onDuplicate?.(id);
  };

  const handleDelete = () => {
    setShowMenu(false);
    if (confirm('Are you sure you want to delete this template?')) {
      onDelete?.(id);
    }
  };

  return (
    <div
      className="template-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        backgroundColor: '#FFFFFF',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--of-radius-card, 16px)',
        padding: 'var(--of-card-padding, 20px)',
        transition: 'all 0.2s ease',
        boxShadow: isHovered 
          ? 'var(--of-shadow-card-hover-saas)' 
          : 'var(--of-shadow-card-saas)',
        // Avoid transform when the menu is open so the "fixed" backdrop can cover the whole viewport.
        transform: showMenu ? 'none' : isHovered ? 'translateY(-1px)' : 'none',
      }}
    >
      {/* Category Pill */}
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: '12px', gap: '12px', paddingRight: '88px' }}
      >
        <span className="of-category-pill">{category}</span>
        {usageCount !== undefined && (
          <span
            className="whitespace-nowrap"
            style={{ fontSize: 'var(--of-text-xs, 11px)', color: '#6B7280' }}
          >
            Used {usageCount} times
          </span>
        )}
      </div>

      {/* Title */}
      <h3
        style={{
          fontSize: '16px',
          fontWeight: 600,
          color: '#111827',
          marginBottom: '8px',
          lineHeight: '1.4',
        }}
      >
        {title}
      </h3>

      {/* Preview (2 lines with ellipsis) */}
      <p
        style={{
          fontSize: 'var(--of-text-body)',
          color: '#6B7280',
          lineHeight: '1.5',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          marginBottom: '16px',
        }}
      >
        {preview}
      </p>

      {/* Menu Button */}
      <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--of-radius-input, 8px)',
            border: 'none',
            background: isHovered ? '#F3F4F6' : 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s ease',
          }}
          aria-label="Template actions"
        >
          <MoreVertical className="w-4 h-4" style={{ color: '#6B7280' }} />
        </button>

        {/* Dropdown Menu */}
        {showMenu && (
          <>
            {/* Backdrop to close menu */}
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 1000,
              }}
              onClick={() => setShowMenu(false)}
            />

            {/* Menu */}
            <div
              style={{
                position: 'absolute',
                top: '40px',
                right: '0',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: 'var(--of-radius-input, 8px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                minWidth: '160px',
                zIndex: 1010,
                overflow: 'hidden',
              }}
            >
              <button
                onClick={handleEdit}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  border: 'none',
                  background: 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: 'var(--of-text-body)',
                  color: '#111827',
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#F9FAFB')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>

              <button
                onClick={handleDuplicate}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  border: 'none',
                  background: 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: 'var(--of-text-body)',
                  color: '#111827',
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#F9FAFB')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <Copy className="w-4 h-4" />
                Duplicate
              </button>

              <div style={{ height: '1px', background: '#E5E7EB', margin: '4px 0' }} />

              <button
                onClick={handleDelete}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  border: 'none',
                  background: 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: 'var(--of-text-body)',
                  color: '#EF4444',
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#FEF2F2')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
