/**
 * Property-Based Test: Feature icons presence
 * Feature: site-restructure-multipage, Property 7: Feature icons presence
 * Validates: Requirements 3.3
 * 
 * Property: For any feature displayed on the features page, 
 * it should have an associated icon or illustration rendered.
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import fc from 'fast-check';
import { FeatureCard, FeatureCardProps } from '@/components/features/FeatureCard';
import { FeatureGrid } from '@/components/features/FeatureGrid';
import { Zap, BarChart3, Target, Users, Shield, Globe } from 'lucide-react';

// Arbitrary for generating feature categories
const categoryArbitrary = fc.constantFrom<'automation' | 'analytics' | 'growth'>(
  'automation',
  'analytics',
  'growth'
);

// Arbitrary for generating a single feature with icon
const featureArbitrary = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 })
    .map(s => s.replace(/[^a-zA-Z0-9]/g, '-'))
    .filter(s => s.length > 0)
    .map(s => s || 'feature'),
  title: fc.string({ minLength: 5, maxLength: 50 }),
  description: fc.string({ minLength: 10, maxLength: 200 }),
  category: categoryArbitrary,
  gradient: fc.constantFrom(
    'from-purple-500 to-pink-500',
    'from-blue-500 to-cyan-500',
    'from-green-500 to-teal-500'
  ),
  icon: fc.constantFrom(Zap, BarChart3, Target, Users, Shield, Globe),
  metric: fc.option(fc.string({ minLength: 3, maxLength: 20 }), { nil: undefined }),
}) as fc.Arbitrary<FeatureCardProps>;

// Arbitrary for generating an array of features
const featuresArrayArbitrary = fc.array(featureArbitrary, { minLength: 1, maxLength: 20 });

describe('Property Test: Feature Icons Presence', () => {
  it('should render an icon for every feature card', () => {
    fc.assert(
      fc.property(featureArbitrary, (feature) => {
        const { container } = render(<FeatureCard {...feature} />);

        // Verify the icon container exists
        const iconContainer = container.querySelector(`[data-testid="feature-icon-${feature.id}"]`);
        expect(iconContainer).toBeTruthy();

        // Verify the icon container has the expected styling
        expect(iconContainer?.classList.contains('w-16')).toBe(true);
        expect(iconContainer?.classList.contains('h-16')).toBe(true);

        // Verify an SVG icon is rendered inside (Lucide icons render as SVG)
        const svgIcon = iconContainer?.querySelector('svg');
        expect(svgIcon).toBeTruthy();
      }),
      { numRuns: 100 }
    );
  });

  it('should render icons for all features in a grid', () => {
    fc.assert(
      fc.property(featuresArrayArbitrary, (features) => {
        const { container } = render(<FeatureGrid features={features} />);

        // For each feature, verify its icon is rendered
        features.forEach(feature => {
          const iconContainer = container.querySelector(`[data-testid="feature-icon-${feature.id}"]`);
          expect(iconContainer).toBeTruthy();

          // Verify SVG icon exists
          const svgIcon = iconContainer?.querySelector('svg');
          expect(svgIcon).toBeTruthy();
        });
      }),
      { numRuns: 100 }
    );
  });

  it('should render icons with proper gradient styling', () => {
    fc.assert(
      fc.property(featureArbitrary, (feature) => {
        const { container } = render(<FeatureCard {...feature} />);

        const iconContainer = container.querySelector(`[data-testid="feature-icon-${feature.id}"]`);
        expect(iconContainer).toBeTruthy();

        // Verify gradient classes are applied
        const hasGradient = iconContainer?.className.includes('bg-gradient-to-br');
        expect(hasGradient).toBe(true);

        // Verify the icon is white (text-white class)
        const hasWhiteText = iconContainer?.className.includes('text-white');
        expect(hasWhiteText).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should render icons that are visible and not empty', () => {
    fc.assert(
      fc.property(featureArbitrary, (feature) => {
        const { container } = render(<FeatureCard {...feature} />);

        const iconContainer = container.querySelector(`[data-testid="feature-icon-${feature.id}"]`);
        expect(iconContainer).toBeTruthy();

        // Verify the icon container is not empty
        expect(iconContainer?.children.length).toBeGreaterThan(0);

        // Verify the SVG has proper dimensions
        const svgIcon = iconContainer?.querySelector('svg');
        expect(svgIcon).toBeTruthy();
        expect(svgIcon?.classList.contains('w-8')).toBe(true);
        expect(svgIcon?.classList.contains('h-8')).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should maintain icon presence across different categories', () => {
    fc.assert(
      fc.property(featuresArrayArbitrary, (features) => {
        const { container } = render(<FeatureGrid features={features} />);

        // Group features by category
        const categories: Array<'automation' | 'analytics' | 'growth'> = ['automation', 'analytics', 'growth'];
        
        categories.forEach(category => {
          const categoryFeatures = features.filter(f => f.category === category);
          
          // For each feature in this category, verify icon exists
          categoryFeatures.forEach(feature => {
            const iconContainer = container.querySelector(`[data-testid="feature-icon-${feature.id}"]`);
            expect(iconContainer).toBeTruthy();
            
            const svgIcon = iconContainer?.querySelector('svg');
            expect(svgIcon).toBeTruthy();
          });
        });
      }),
      { numRuns: 100 }
    );
  });
});
