'use client';

import React from 'react';
import { TailAdminAvatar } from '@/components/ui/tailadmin/TailAdminAvatar';
import './fan-card.css';

export interface FanCardProps {
  id: string;
  name: string;
  avatarUrl?: string;
  lastMessage: string;
  timestamp: string;
  unreadCount?: number;
  isOnline?: boolean;
  isActive?: boolean;
  tags?: string[];
  onClick?: () => void;
}

export const FanCard: React.FC<FanCardProps> = ({
  id,
  name,
  avatarUrl,
  lastMessage,
  timestamp,
  unreadCount = 0,
  isOnline = false,
  isActive = false,
  tags = [],
  onClick,
}) => {
  return (
    <div
      className={`fan-card ${isActive ? 'fan-card--active' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      data-conversation-id={id}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      aria-label={`Conversation with ${name}${unreadCount > 0 ? `, ${unreadCount} unread messages` : ''}`}
      aria-pressed={isActive}
    >
      <div className="fan-card__avatar-container">
        <TailAdminAvatar
          src={avatarUrl}
          alt={name}
          size="md"
          fallback={name.charAt(0).toUpperCase()}
          className="avatar avatar--list"
        />
        {isOnline && (
          <span 
            className="fan-card__online-indicator"
            aria-label="Online"
          />
        )}
      </div>

      <div className="fan-card__content">
        <div className="fan-card__header">
          <h3 className="fan-card__name">{name}</h3>
          <span className="fan-card__timestamp">{timestamp}</span>
        </div>

        <div className="fan-card__message-row">
          <p className="fan-card__last-message">
            {lastMessage}
          </p>
          {unreadCount > 0 && (
            <span 
              className="fan-card__unread-badge"
              aria-label={`${unreadCount} unread messages`}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>

        {tags.length > 0 && (
          <div className="fan-card__tags">
            {tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="fan-card__tag" data-tag={tag}>
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="fan-card__tag fan-card__tag--more">
                +{tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
