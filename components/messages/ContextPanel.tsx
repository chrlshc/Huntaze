'use client';

import React from 'react';
import { TailAdminCard } from '@/components/ui/tailadmin/TailAdminCard';
import { TailAdminAvatar } from '@/components/ui/tailadmin/TailAdminAvatar';
import { TailAdminButton } from '@/components/ui/tailadmin/TailAdminButton';
import './context-panel.css';

interface Note {
  id: string;
  content: string;
  createdAt: Date;
  author: string;
  category: 'engagement' | 'demandes' | 'risques';
}

interface Tag {
  id: string;
  label: string;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
}

interface FanContext {
  fanId: string;
  name: string;
  avatar: string;
  status: 'active' | 'inactive' | 'vip';
  joinDate: Date;
  lastActive: Date;
  totalSpent: number;
  subscriptionTier: string;
  notes: Note[];
  tags: Tag[];
}

interface ContextPanelProps {
  fanContext: FanContext | null;
  onAddNote?: () => void;
  onRemoveTag?: (tagId: string) => void;
}

export const ContextPanel: React.FC<ContextPanelProps> = ({
  fanContext,
  onAddNote,
  onRemoveTag,
}) => {
  if (!fanContext) {
    return (
      <div className="context-panel-container">
        <TailAdminCard padding="lg">
          <div className="context-panel-empty">
            <p className="empty-state-text">
              Select a conversation to see details
            </p>
          </div>
        </TailAdminCard>
      </div>
    );
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'status-badge status-active';
      case 'vip':
        return 'status-badge status-vip';
      case 'inactive':
        return 'status-badge status-inactive';
      default:
        return 'status-badge';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'vip':
        return 'VIP';
      case 'inactive':
        return 'Inactive';
      default:
        return status;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  return (
    <div className="context-panel-container">
      {/* Carte 1 : Header Profil */}
      <div className="right-card context-panel-header">
        {/* Logo Huntaze en haut à gauche - NOIR */}
        <div className="context-panel-header__logo">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z"/>
            <path d="M2 17L12 22L22 17"/>
            <path d="M2 12L12 17L22 12"/>
          </svg>
        </div>
        
        <TailAdminAvatar
          src={fanContext.avatar}
          alt={fanContext.name}
          size="lg"
          className="profile-avatar"
        />
        <h3 className="fan-name">{fanContext.name}</h3>
        
        {/* Tags en pills */}
        {fanContext.tags.length > 0 && (
          <div className="context-panel-header__tags">
            {fanContext.tags.slice(0, 3).map((tag) => (
              <span key={tag.id} className="tag-chip">
                {tag.label}
              </span>
            ))}
            {fanContext.tags.length > 3 && (
              <span className="tag-chip tag-chip--more">
                +{fanContext.tags.length - 3}
              </span>
            )}
          </div>
        )}
        
        {/* Badge abonnement */}
        <span className={getStatusBadgeClass(fanContext.status)}>
          {getStatusLabel(fanContext.status)}
        </span>
      </div>

      {/* Carte 2 : Infos clés */}
      <div className="right-card context-panel-section">
        <h4 className="section-title">INFORMATION</h4>
        <div className="info-grid">
          <span className="info-label">Since</span>
          <span className="info-value">{formatDate(fanContext.joinDate)}</span>
          
          <span className="info-label">Last activity</span>
          <span className="info-value">{formatDate(fanContext.lastActive)}</span>
          
          <span className="info-label">Spending</span>
          <span className="info-value info-value--highlight">{formatCurrency(fanContext.totalSpent)}</span>
          
          <span className="info-label">Subscription</span>
          <span className="info-value">{fanContext.subscriptionTier}</span>
        </div>
      </div>

      {/* Carte 3 : Notes & Contexte */}
      <div className="right-card context-panel-section">
        <h4 className="section-title">NOTES</h4>
        
        {fanContext.notes.length === 0 ? (
          <div className="notes-empty">
            <p className="empty-text">No notes for this fan</p>
          </div>
        ) : (
          <div className="notes-categories">
            {/* Engagement */}
            <div className="note-category">
              <h5 className="category-title">ENGAGEMENT</h5>
              {fanContext.notes.filter(n => n.category === 'engagement').length === 0 ? (
                <p className="category-empty">No notes</p>
              ) : (
                <div className="category-notes">
                  {fanContext.notes
                    .filter(n => n.category === 'engagement')
                    .map((note) => (
                      <div key={note.id} className="note-chip">
                        {note.content}
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Demandes */}
            <div className="note-category">
              <h5 className="category-title">REQUESTS</h5>
              {fanContext.notes.filter(n => n.category === 'demandes').length === 0 ? (
                <p className="category-empty">No requests</p>
              ) : (
                <div className="category-notes">
                  {fanContext.notes
                    .filter(n => n.category === 'demandes')
                    .map((note) => (
                      <div key={note.id} className="note-chip">
                        {note.content}
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Risques */}
            <div className="note-category">
              <h5 className="category-title">RISKS</h5>
              {fanContext.notes.filter(n => n.category === 'risques').length === 0 ? (
                <span className="risk-badge--none">✓ No risk identified</span>
              ) : (
                <div className="category-notes">
                  {fanContext.notes
                    .filter(n => n.category === 'risques')
                    .map((note) => (
                      <div key={note.id} className="note-chip">
                        {note.content}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}
        
        <TailAdminButton
          variant="secondary"
          size="sm"
          onClick={onAddNote}
          className="add-note-button"
        >
          <svg
            className="button-icon"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8 3.33334V12.6667M3.33334 8H12.6667"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          + New note
        </TailAdminButton>
      </div>
    </div>
  );
};
