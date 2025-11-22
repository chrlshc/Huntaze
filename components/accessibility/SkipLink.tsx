'use client';

/**
 * Skip to Main Content Link
 * 
 * Provides keyboard users with a way to skip repetitive navigation
 * and jump directly to the main content area.
 * 
 * WCAG 2.1 AA Requirement: 2.4.1 Bypass Blocks
 */

export function SkipLink() {
  return (
    <a href="#main-content" className="skip-link">
      Skip to main content
    </a>
  );
}
