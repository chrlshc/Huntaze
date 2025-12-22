/**
 * CategoryPill Component
 * Feature: onlyfans-settings-saas-transformation
 * Property 4: Card Surface Consistency
 * 
 * Category pill for visual categorization with consistent styling.
 * 
 * @requirements
 * - Neutral by default (soft filled)
 * - AI tone uses violet accent sparingly
 */

import React from 'react';

export interface CategoryPillProps {
  /** Category text to display */
  children: React.ReactNode;
  /** Optional CSS class name */
  className?: string;
  /** Optional tone (default: neutral) */
  tone?: 'neutral' | 'ai';
}

export const CategoryPill: React.FC<CategoryPillProps> = ({
  children,
  className = '',
  tone = 'neutral',
}) => {
  return (
    <span
      className={`of-category-pill ${className}`}
      data-tone={tone === 'ai' ? 'ai' : undefined}
    >
      {children}
    </span>
  );
};
