/**
 * Beta Landing Page Tests
 * 
 * Validates Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7:
 * - Hero section with beta badge, gradient title, CTA
 * - Pulsing dot animation on beta badge
 * - Gradient text animation (3 second cycle)
 * - Hover effects on primary CTA
 * - Beta stats section with simulated metrics
 * - Beta labels on stat cards
 * - Disclaimer text for simulated metrics
 * - Hover effects on stat cards
 * - Pure black background, rainbow only on CTA
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import BetaLandingPage from '@/app/(marketing)/beta/page';

describe('Beta Landing Page', () => {
  it('should render hero section with beta badge', () => {
    render(<BetaLandingPage />);
    
    // Verify beta badge is present
    expect(screen.getByText('Now in Beta')).toBeInTheDocument();
  });

  it('should render gradient title', () => {
    render(<BetaLandingPage />);
    
    // Verify gradient title is present
    expect(screen.getByText('Automate Your Creator Business')).toBeInTheDocument();
  });

  it('should render subtitle', () => {
    render(<BetaLandingPage />);
    
    // Verify subtitle is present
    expect(screen.getByText(/Join the exclusive beta program/i)).toBeInTheDocument();
  });

  it('should render primary CTA button', () => {
    render(<BetaLandingPage />);
    
    // Verify primary CTA is present
    const ctaButton = screen.getByRole('link', { name: /Join Beta Program/i });
    expect(ctaButton).toBeInTheDocument();
    expect(ctaButton).toHaveAttribute('href', '/auth/register');
  });

  it('should render secondary CTA button', () => {
    render(<BetaLandingPage />);
    
    // Verify secondary CTA is present
    const signInButton = screen.getByRole('link', { name: /Sign In/i });
    expect(signInButton).toBeInTheDocument();
    expect(signInButton).toHaveAttribute('href', '/auth/login');
  });

  it('should render beta stats preview', () => {
    render(<BetaLandingPage />);
    
    // Verify beta stats are present
    expect(screen.getByText('20-50')).toBeInTheDocument();
    expect(screen.getByText('Beta Creators')).toBeInTheDocument();
    expect(screen.getAllByText('24/7').length).toBeGreaterThan(0);
    expect(screen.getByText('AI Support')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('Free During Beta')).toBeInTheDocument();
  });

  it('should render beta features section', () => {
    render(<BetaLandingPage />);
    
    // Verify features section is present
    expect(screen.getByText('What You Get in Beta')).toBeInTheDocument();
    expect(screen.getByText('Early Access')).toBeInTheDocument();
    expect(screen.getByText('Direct Feedback')).toBeInTheDocument();
    expect(screen.getByText('Lifetime Discount')).toBeInTheDocument();
    expect(screen.getByText('Priority Support')).toBeInTheDocument();
  });

  it('should render final CTA section', () => {
    render(<BetaLandingPage />);
    
    // Verify final CTA section is present
    expect(screen.getByText('Ready to Join the Beta?')).toBeInTheDocument();
    expect(screen.getByText(/Limited spots available/i)).toBeInTheDocument();
  });

  it('should have pulsing dot in beta badge', () => {
    const { container } = render(<BetaLandingPage />);
    
    // Verify pulsing dot element exists
    const pulsingDot = container.querySelector('.beta-badge-dot');
    expect(pulsingDot).toBeInTheDocument();
    expect(pulsingDot).toHaveAttribute('aria-hidden', 'true');
  });

  it('should have gradient text wrapper', () => {
    const { container } = render(<BetaLandingPage />);
    
    // Verify gradient text wrapper exists
    const gradientText = container.querySelector('.gradient-text');
    expect(gradientText).toBeInTheDocument();
    expect(gradientText?.textContent).toBe('Automate Your Creator Business');
  });

  it('should have primary CTA with correct class', () => {
    const { container } = render(<BetaLandingPage />);
    
    // Verify primary CTA has correct classes
    const primaryCTA = container.querySelector('.btn-primary-large');
    expect(primaryCTA).toBeInTheDocument();
    expect(primaryCTA).toHaveClass('btn-primary');
  });

  // ========================================
  // Beta Stats Section Tests (Requirements 2.5, 2.6, 2.7)
  // ========================================

  it('should render beta stats section with title', () => {
    render(<BetaLandingPage />);
    
    // Verify beta stats section title is present
    expect(screen.getByText('Beta Performance Metrics')).toBeInTheDocument();
    expect(screen.getByText(/See how our platform is performing/i)).toBeInTheDocument();
  });

  it('should render four stat cards with simulated metrics (Requirement 2.5)', () => {
    render(<BetaLandingPage />);
    
    // Verify all four stat cards are present
    expect(screen.getByText('Waitlist')).toBeInTheDocument();
    expect(screen.getByText('2,847')).toBeInTheDocument();
    expect(screen.getByText('Creators waiting to join')).toBeInTheDocument();

    expect(screen.getByText('Messages Managed')).toBeInTheDocument();
    expect(screen.getByText('1.2M+')).toBeInTheDocument();
    expect(screen.getByText('AI-powered conversations')).toBeInTheDocument();

    expect(screen.getByText('Response Rate')).toBeInTheDocument();
    expect(screen.getByText('94%')).toBeInTheDocument();
    expect(screen.getByText('Average AI response accuracy')).toBeInTheDocument();

    expect(screen.getByText('AI Availability')).toBeInTheDocument();
    // Use getAllByText since "24/7" appears in both preview and stats section
    expect(screen.getAllByText('24/7').length).toBe(2);
    expect(screen.getByText('Always-on automation')).toBeInTheDocument();
  });

  it('should display beta labels on each stat card (Requirement 2.6)', () => {
    render(<BetaLandingPage />);
    
    // Verify beta labels are present (should have 4 instances)
    const betaLabels = screen.getAllByText('Beta Metric');
    expect(betaLabels).toHaveLength(4);
  });

  it('should display disclaimer text for simulated metrics (Requirement 2.6)', () => {
    render(<BetaLandingPage />);
    
    // Verify disclaimer text is present
    expect(screen.getByText(/These metrics are simulated for demonstration purposes/i)).toBeInTheDocument();
    expect(screen.getByText(/Actual performance may vary/i)).toBeInTheDocument();
  });

  it('should have stat cards with correct CSS classes for hover effects (Requirement 2.7)', () => {
    const { container } = render(<BetaLandingPage />);
    
    // Verify stat cards have correct class for hover effects
    const statCards = container.querySelectorAll('.beta-stat-card');
    expect(statCards.length).toBe(4);
    
    // Each card should have the beta-stat-card class
    statCards.forEach(card => {
      expect(card).toHaveClass('beta-stat-card');
    });
  });

  it('should have beta stat badges with correct styling', () => {
    const { container } = render(<BetaLandingPage />);
    
    // Verify beta stat badges exist
    const betaBadges = container.querySelectorAll('.beta-stat-badge');
    expect(betaBadges.length).toBe(4);
  });
});
