'use client';

import React, { ReactNode, useEffect } from 'react';
import '@/styles/global-theme-overrides.css';
import '@/styles/onlyfans-polish-tokens.css';

interface GlobalThemeProviderProps {
  children: ReactNode;
}

/**
 * GlobalThemeProvider
 * 
 * Applies the OnlyFans design system globally across all pages to achieve
 * a consistent Shopify-like interface.
 * 
 * This adds the 'onlyfans-theme' class to both documentElement and body
 * which activates the design tokens in onlyfans-polish-tokens.css
 */
export function GlobalThemeProvider({ children }: GlobalThemeProviderProps) {
  useEffect(() => {
    // Apply theme classes
    const themeClass = 'onlyfans-theme';
    document.documentElement.classList.add(themeClass);
    document.body.classList.add(themeClass);
    
    // Add global style fixes for layout issues
    const styleEl = document.createElement('style');
    styleEl.id = 'global-theme-fixes';
    styleEl.textContent = `
      /* Fix container width consistency */
      .container, 
      .max-w-container {
        max-width: var(--of-layout-max-width, 1100px) !important;
        padding-left: var(--of-layout-padding, 32px) !important;
        padding-right: var(--of-layout-padding, 32px) !important;
      }
      
      /* Fix card styling inconsistencies */
      .card, 
      .border-card,
      .dashboard-card,
      .settings-card {
        border-radius: var(--of-radius-card, 20px) !important;
        box-shadow: var(--of-shadow-card-saas) !important;
        padding: var(--of-card-padding, 24px) !important;
        border: none !important;
        background: #FFFFFF !important;
      }
      
      /* Fix form input styling */
      input[type="text"], 
      input[type="email"], 
      input[type="password"],
      input[type="number"],
      input[type="search"],
      textarea,
      select {
        border-radius: var(--of-radius-input, 16px) !important;
        padding: var(--of-input-padding, 12px 20px) !important;
      }
      
      /* Fix button styling */
      .btn, 
      button:not(.plain-button):not(.unstyled) {
        border-radius: 12px !important;
      }
      
      /* Fix padding in main content area */
      main#main-content {
        padding: var(--of-space-6, 24px) !important;
      }
      
      /* Fix inconsistent gap spacing */
      .gap-4 {
        gap: var(--of-gap-md, 12px) !important;
      }
      
      .gap-6 {
        gap: var(--of-space-6, 24px) !important;
      }
      
      /* Fix section spacing */
      section + section {
        margin-top: var(--of-section-gap, 32px) !important;
      }
    `;
    
    document.head.appendChild(styleEl);

    // Clean up function
    return () => {
      document.documentElement.classList.remove(themeClass);
      document.body.classList.remove(themeClass);
      const styleElement = document.getElementById('global-theme-fixes');
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, []);

  return <>{children}</>;
}
