'use client';

import React from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, XCircle, X } from 'lucide-react';

export interface ShopifyBannerProps {
  status: 'info' | 'warning' | 'success' | 'critical';
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss?: () => void;
  className?: string;
}

const statusConfig = {
  info: {
    bg: 'bg-[#eef6ff]',
    border: 'border-[#b4d5fe]',
    icon: AlertCircle,
    iconColor: 'text-[#2c6ecb]',
    titleColor: 'text-[#1a1a1a]',
  },
  warning: {
    bg: 'bg-[#fff8e6]',
    border: 'border-[#ffd79d]',
    icon: AlertTriangle,
    iconColor: 'text-[#b98900]',
    titleColor: 'text-[#1a1a1a]',
  },
  success: {
    bg: 'bg-[#e6f7f2]',
    border: 'border-[#95d5c3]',
    icon: CheckCircle,
    iconColor: 'text-[#008060]',
    titleColor: 'text-[#1a1a1a]',
  },
  critical: {
    bg: 'bg-[#fff4f4]',
    border: 'border-[#fdb5b5]',
    icon: XCircle,
    iconColor: 'text-[#d72c0d]',
    titleColor: 'text-[#1a1a1a]',
  },
};

export function ShopifyBanner({
  status,
  title,
  description,
  action,
  onDismiss,
  className = '',
}: ShopifyBannerProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div
      className={`
        ${config.bg}
        ${config.border}
        border
        rounded-lg
        p-4
        ${className}
      `.trim()}
      role="alert"
      data-status={status}
      data-testid="shopify-banner"
    >
      <div className="flex items-start gap-3">
        <Icon 
          className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.iconColor}`}
          data-testid="banner-icon"
        />
        
        <div className="flex-1 min-w-0">
          <h3 
            className={`text-sm font-semibold ${config.titleColor}`}
            data-testid="banner-title"
          >
            {title}
          </h3>
          
          {description && (
            <p 
              className="text-sm text-[#6b7177] mt-1"
              data-testid="banner-description"
            >
              {description}
            </p>
          )}
          
          {action && (
            <button
              onClick={action.onClick}
              className="text-sm font-medium text-[#2c6ecb] hover:text-[#1a5bb5] mt-2 underline"
              data-testid="banner-action"
            >
              {action.label}
            </button>
          )}
        </div>
        
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 p-1 rounded hover:bg-black/5 transition-colors"
            aria-label="Dismiss"
            data-testid="banner-dismiss"
          >
            <X className="w-4 h-4 text-[#6b7177]" />
          </button>
        )}
      </div>
    </div>
  );
}

export default ShopifyBanner;
