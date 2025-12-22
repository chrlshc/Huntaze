'use client';

import React from 'react';
import Link from 'next/link';
import { TailAdminButton } from '@/components/ui/tailadmin/TailAdminButton';
import { TailAdminAvatar } from '@/components/ui/tailadmin/TailAdminAvatar';
import './messaging-header.css';

interface MessagingHeaderProps {
  userName?: string;
  userAvatar?: string;
  unreadNotifications?: number;
  onNewMessage?: () => void;
  className?: string;
}

/**
 * MessagingHeader - Customized TailAdmin header for Huntaze messaging
 * 
 * Features:
 * - Huntaze branding (logo + name)
 * - Notification bell with badge
 * - User profile dropdown
 * - Primary action button (New Message)
 * - Fully responsive
 */
export function MessagingHeader({
  userName = 'User',
  userAvatar,
  unreadNotifications = 0,
  onNewMessage,
  className = '',
}: MessagingHeaderProps) {
  return (
    <header 
      className={`messaging-header ${className}`}
      role="banner"
    >
      <div className="messaging-header__container">
        {/* Left: Huntaze Branding */}
        <div className="messaging-header__brand">
          <Link 
            href="/home" 
            className="messaging-header__logo-link"
            aria-label="Huntaze home"
          >
            {/* Huntaze Logo */}
            <div className="messaging-header__logo">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-label="Huntaze Logo"
              >
                {/* Placeholder logo - replace with actual Huntaze logo */}
                <rect width="24" height="24" rx="6" fill="currentColor" className="text-primary" />
                <text
                  x="12"
                  y="17"
                  fontSize="14"
                  fontWeight="bold"
                  fill="white"
                  textAnchor="middle"
                >
                  H
                </text>
              </svg>
            </div>
            
            {/* Huntaze Text (hidden on mobile) */}
            <span className="messaging-header__brand-text">
              Huntaze
            </span>
          </Link>
          
          {/* Page Title (hidden on mobile) */}
          <span className="messaging-header__page-title">
            Messages
          </span>
        </div>

        {/* Right: Actions */}
        <nav 
          className="messaging-header__actions"
          aria-label="Header actions"
        >
          {/* New Message Button (Primary Action) */}
          <TailAdminButton
            variant="primary"
            size="md"
            onClick={onNewMessage}
            className="messaging-header__new-message"
            aria-label="Create new message"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="messaging-header__icon"
            >
              <path
                d="M10 5V15M5 10H15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <span className="messaging-header__button-text">New Message</span>
          </TailAdminButton>

          {/* Notifications */}
          <button
            className="icon-button messaging-header__notification-btn"
            aria-label={`Notifications${unreadNotifications > 0 ? ` (${unreadNotifications} unread)` : ''}`}
            aria-haspopup="menu"
            aria-expanded="false"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12.5 14.1667H16.6667L15.4959 12.9959C15.1784 12.6784 15 12.2478 15 11.7988V9.16667C15 7.15631 13.6087 5.47091 11.6667 4.78452V4.16667C11.6667 3.24619 10.9205 2.5 10 2.5C9.07953 2.5 8.33333 3.24619 8.33333 4.16667V4.78452C6.39135 5.47091 5 7.15631 5 9.16667V11.7988C5 12.2478 4.82163 12.6784 4.50411 12.9959L3.33333 14.1667H7.5M12.5 14.1667V15C12.5 16.3807 11.3807 17.5 10 17.5C8.61929 17.5 7.5 16.3807 7.5 15V14.1667M12.5 14.1667H7.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {unreadNotifications > 0 && (
              <span 
                className="messaging-header__notification-badge"
                aria-label={`${unreadNotifications} unread notifications`}
              >
                {unreadNotifications > 99 ? '99+' : unreadNotifications}
              </span>
            )}
          </button>

          {/* User Profile */}
          <button
            className="messaging-header__profile-btn"
            aria-label={`User profile menu for ${userName}`}
            aria-haspopup="menu"
            aria-expanded="false"
          >
            <TailAdminAvatar
              src={userAvatar}
              alt={userName}
              size="sm"
              status="online"
            />
            <span className="messaging-header__user-name">
              {userName}
            </span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="messaging-header__dropdown-icon"
            >
              <path
                d="M4 6L8 10L12 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </nav>
      </div>
    </header>
  );
}
