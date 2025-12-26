/**
 * ShopifyConnectionCard Component
 * 
 * Displays a connection prompt in Shopify admin style.
 * Used when a feature requires platform connection (like OnlyFans).
 * 
 * Design reference: Shopify Orders/Products empty states
 */

import React from 'react';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

export interface ShopifyConnectionCardProps {
  /** Main illustration - can be an image URL or React node */
  illustration?: React.ReactNode;
  /** Main title */
  title: string;
  /** Description text */
  description: string;
  /** Primary action button label */
  actionLabel: string;
  /** Primary action URL (uses Link) */
  actionHref?: string;
  /** Primary action onClick (alternative to href) */
  onAction?: () => void;
  /** Secondary link text */
  secondaryLabel?: string;
  /** Secondary link URL */
  secondaryHref?: string;
  /** Additional CSS classes */
  className?: string;
}

export const ShopifyConnectionCard: React.FC<ShopifyConnectionCardProps> = ({
  illustration,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  secondaryLabel,
  secondaryHref,
  className = '',
}) => {
  const ActionButton = () => {
    const buttonContent = (
      <button
        className="shopify-connection-btn"
        onClick={onAction}
        type="button"
      >
        {actionLabel}
      </button>
    );

    if (actionHref) {
      return (
        <Link href={actionHref} style={{ textDecoration: 'none' }}>
          {buttonContent}
        </Link>
      );
    }

    return buttonContent;
  };

  return (
    <div className={`shopify-connection-card ${className}`}>
      {/* Illustration */}
      {illustration && (
        <div className="shopify-connection-illustration">
          {illustration}
        </div>
      )}

      {/* Content */}
      <div className="shopify-connection-content">
        <h2 className="shopify-connection-title">{title}</h2>
        <p className="shopify-connection-description">{description}</p>
      </div>

      {/* Actions */}
      <div className="shopify-connection-actions">
        <ActionButton />
      </div>

      {/* Secondary Link */}
      {secondaryLabel && secondaryHref && (
        <Link href={secondaryHref} className="shopify-connection-secondary">
          {secondaryLabel}
        </Link>
      )}
    </div>
  );
};

// Default illustration component (document/order style)
export const ConnectionIllustration: React.FC<{ type?: 'document' | 'product' | 'message' | 'ppv' }> = ({ 
  type = 'document' 
}) => {
  const illustrations = {
    document: (
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Document base */}
        <rect x="30" y="20" width="60" height="80" rx="4" fill="#E4E5E7" stroke="#8C9196" strokeWidth="1.5"/>
        {/* Document fold */}
        <path d="M70 20V35H85" stroke="#8C9196" strokeWidth="1.5" fill="#F6F6F7"/>
        <path d="M70 20L85 35H70V20Z" fill="#F6F6F7" stroke="#8C9196" strokeWidth="1.5"/>
        {/* Lines */}
        <rect x="40" y="45" width="40" height="4" rx="2" fill="#B5B5B5"/>
        <rect x="40" y="55" width="30" height="4" rx="2" fill="#D4D4D4"/>
        <rect x="40" y="65" width="35" height="4" rx="2" fill="#D4D4D4"/>
        {/* Checkmark circle */}
        <circle cx="75" cy="75" r="18" fill="#AEE9D1" stroke="#008060" strokeWidth="2"/>
        <path d="M67 75L72 80L83 69" stroke="#008060" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    product: (
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Box */}
        <rect x="25" y="35" width="70" height="55" rx="4" fill="#E4E5E7" stroke="#8C9196" strokeWidth="1.5"/>
        {/* Box top */}
        <path d="M25 45L60 30L95 45" stroke="#8C9196" strokeWidth="1.5" fill="#F6F6F7"/>
        {/* Box center line */}
        <line x1="60" y1="30" x2="60" y2="90" stroke="#8C9196" strokeWidth="1.5"/>
        {/* Plus circle */}
        <circle cx="80" cy="75" r="18" fill="#B4E1FA" stroke="#006FBB" strokeWidth="2"/>
        <path d="M80 67V83M72 75H88" stroke="#006FBB" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    ),
    message: (
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Chat bubble */}
        <path d="M25 35C25 31.6863 27.6863 29 31 29H89C92.3137 29 95 31.6863 95 35V70C95 73.3137 92.3137 76 89 76H45L30 91V76H31C27.6863 76 25 73.3137 25 70V35Z" fill="#E4E5E7" stroke="#8C9196" strokeWidth="1.5"/>
        {/* Message lines */}
        <rect x="35" y="42" width="50" height="4" rx="2" fill="#B5B5B5"/>
        <rect x="35" y="52" width="35" height="4" rx="2" fill="#D4D4D4"/>
        <rect x="35" y="62" width="40" height="4" rx="2" fill="#D4D4D4"/>
        {/* Link circle */}
        <circle cx="80" cy="80" r="18" fill="#FFD6A4" stroke="#B98900" strokeWidth="2"/>
        <path d="M75 80H85M80 75V85" stroke="#B98900" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    ),
    ppv: (
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Video frame */}
        <rect x="20" y="30" width="80" height="50" rx="4" fill="#E4E5E7" stroke="#8C9196" strokeWidth="1.5"/>
        {/* Play button */}
        <circle cx="60" cy="55" r="15" fill="#F6F6F7" stroke="#8C9196" strokeWidth="1.5"/>
        <path d="M55 48L70 55L55 62V48Z" fill="#8C9196"/>
        {/* Price tag */}
        <circle cx="85" cy="75" r="18" fill="#AEE9D1" stroke="#008060" strokeWidth="2"/>
        <text x="85" y="80" textAnchor="middle" fill="#008060" fontSize="14" fontWeight="600">$</text>
      </svg>
    ),
  };

  return illustrations[type] || illustrations.document;
};

export default ShopifyConnectionCard;
