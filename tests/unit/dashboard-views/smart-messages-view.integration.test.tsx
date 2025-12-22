/**
 * Integration tests for Smart Messages View
 * 
 * Tests that the Smart Messages view renders correctly with:
 * - InfoCard components for highlights
 * - DashboardEmptyState component with all required elements
 * - Consistent CTA wording and styling
 * 
 * Validates Requirements: 1.1, 1.2, 1.3
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SmartMessagesPage from '@/app/(app)/onlyfans/smart-messages/page';

// Mock the PageLayout component
vi.mock('@/components/layout/PageLayout', () => ({
  PageLayout: ({ children, title, actions }: any) => (
    <div data-testid="page-layout">
      <div data-testid="page-title">{title}</div>
      <div data-testid="page-actions">{actions}</div>
      {children}
    </div>
  ),
}));

describe('Smart Messages View Integration', () => {
  describe('Highlights Section', () => {
    it('renders two InfoCard components side-by-side', () => {
      render(<SmartMessagesPage />);
      
      // Check that both InfoCards are rendered
      const infoCards = screen.getAllByTestId('info-card');
      expect(infoCards).toHaveLength(2);
    });

    it('renders first InfoCard with correct content', () => {
      render(<SmartMessagesPage />);
      
      // Check first card content
      expect(screen.getByText('Centralize your message automations')).toBeInTheDocument();
      expect(screen.getByText(/Manage welcome flows, re-engagement nudges/)).toBeInTheDocument();
    });

    it('renders second InfoCard with correct content', () => {
      render(<SmartMessagesPage />);
      
      // Check second card content
      expect(screen.getByText('Let AI handle the busywork')).toBeInTheDocument();
      expect(screen.getByText(/Use smart rules to auto-respond/)).toBeInTheDocument();
    });

    it('applies correct styling to InfoCards', () => {
      render(<SmartMessagesPage />);
      
      const infoCards = screen.getAllByTestId('info-card');
      
      // Verify InfoCards have the correct CSS classes
      infoCards.forEach(card => {
        expect(card).toHaveClass('info-card');
      });
    });
  });

  describe('Empty State', () => {
    it('renders DashboardEmptyState component', () => {
      render(<SmartMessagesPage />);
      
      const emptyState = screen.getByTestId('dashboard-empty-state');
      expect(emptyState).toBeInTheDocument();
    });

    it('displays correct title', () => {
      render(<SmartMessagesPage />);
      
      const title = screen.getByTestId('empty-state-title');
      expect(title).toHaveTextContent('No smart rules yet');
    });

    it('displays correct description', () => {
      render(<SmartMessagesPage />);
      
      const description = screen.getByTestId('empty-state-description');
      expect(description).toHaveTextContent('Create automated workflows to save time and engage fans more effectively');
    });

    it('displays all three benefits', () => {
      render(<SmartMessagesPage />);
      
      const benefits = screen.getByTestId('empty-state-benefits');
      expect(benefits).toBeInTheDocument();
      
      // Check for all three benefit items
      expect(screen.getByText('Auto-respond to new subscribers')).toBeInTheDocument();
      expect(screen.getByText('Re-engage inactive fans')).toBeInTheDocument();
      expect(screen.getByText('Prioritize VIP conversations')).toBeInTheDocument();
    });

    it('displays CTA button with correct label', () => {
      render(<SmartMessagesPage />);
      
      const ctaButton = screen.getByTestId('empty-state-cta');
      expect(ctaButton).toHaveTextContent('New Smart Rule');
    });

    it('CTA button has icon', () => {
      render(<SmartMessagesPage />);
      
      const ctaButton = screen.getByTestId('empty-state-cta');
      const icon = ctaButton.querySelector('.dashboard-empty-state__cta-icon');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('CTA Consistency', () => {
    it('top-right CTA and empty state CTA have identical wording', () => {
      render(<SmartMessagesPage />);
      
      // Get both CTAs
      const pageActions = screen.getByTestId('page-actions');
      const emptyStateCta = screen.getByTestId('empty-state-cta');
      
      // Both should contain "New Smart Rule"
      expect(pageActions).toHaveTextContent('New Smart Rule');
      expect(emptyStateCta).toHaveTextContent('New Smart Rule');
    });

    it('empty state CTA has correct styling classes', () => {
      render(<SmartMessagesPage />);
      
      const ctaButton = screen.getByTestId('empty-state-cta');
      expect(ctaButton).toHaveClass('dashboard-empty-state__cta');
    });
  });

  describe('Responsive Behavior', () => {
    it('highlights section has responsive grid layout', () => {
      render(<SmartMessagesPage />);
      
      // Find the grid container
      const gridContainer = screen.getAllByTestId('info-card')[0].parentElement;
      expect(gridContainer).toHaveClass('grid');
    });
  });

  describe('Accessibility', () => {
    it('empty state CTA is a button element', () => {
      render(<SmartMessagesPage />);
      
      const ctaButton = screen.getByTestId('empty-state-cta');
      expect(ctaButton.tagName).toBe('BUTTON');
    });

    it('empty state has proper heading hierarchy', () => {
      render(<SmartMessagesPage />);
      
      const title = screen.getByTestId('empty-state-title');
      expect(title.tagName).toBe('H3');
    });

    it('benefits list is a proper list element', () => {
      render(<SmartMessagesPage />);
      
      const benefits = screen.getByTestId('empty-state-benefits');
      expect(benefits.tagName).toBe('UL');
    });
  });
});
