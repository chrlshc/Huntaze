/**
 * Property-Based Test: Features organized by category
 * Feature: site-restructure-multipage, Property 6: Features organized by category
 * Validates: Requirements 3.2
 * 
 * Property: For any set of features displayed on the features page, 
 * they should be grouped and organized by their category property.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import fc from 'fast-check';
import { FeatureGrid } from '@/components/features/FeatureGrid';
import { FeatureCardProps } from '@/components/features/FeatureCard';
import { Zap, BarChart3, Target } from 'lucide-react';

// Arbitrary for generating feature categories
const categoryArbitrary = fc.constantFrom<'automation' | 'analytics' | 'growth'>(
  'automation',
  'analytics',
  'growth'
);

// Arbitrary for generating a single feature
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
  icon: fc.constantFrom(Zap, BarChart3, Target),
  metric: fc.option(fc.string({ minLength: 3, maxLength: 20 }), { nil: undefined }),
}) as fc.Arbitrary<FeatureCardProps>;

// Arbitrary for generating an array of features
const featuresArrayArbitrary = fc.array(featureArbitrary, { minLength: 1, maxLength: 20 });

describe('Property Test: Features Organization by Category', () => {
  it('should organize features by category in the correct order', () => {
    fc.assert(
      fc.property(featuresArrayArbitrary, (features) => {
        // Render the FeatureGrid with generated features
        const { container } = render(<FeatureGrid features={features} />);

        // Get all category sections
        const automationSection = container.querySelector('[data-testid="category-automation"]');
        const analyticsSection = container.querySelector('[data-testid="category-analytics"]');
        const growthSection = container.querySelector('[data-testid="category-growth"]');

        // Count features by category in the input
        const featuresByCategory = features.reduce((acc, feature) => {
          acc[feature.category] = (acc[feature.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Verify automation section
        if (featuresByCategory.automation > 0) {
          expect(automationSection).toBeTruthy();
          const automationCards = automationSection?.querySelectorAll('[data-category="automation"]');
          expect(automationCards?.length).toBe(featuresByCategory.automation);
        } else {
          expect(automationSection).toBeFalsy();
        }

        // Verify analytics section
        if (featuresByCategory.analytics > 0) {
          expect(analyticsSection).toBeTruthy();
          const analyticsCards = analyticsSection?.querySelectorAll('[data-category="analytics"]');
          expect(analyticsCards?.length).toBe(featuresByCategory.analytics);
        } else {
          expect(analyticsSection).toBeFalsy();
        }

        // Verify growth section
        if (featuresByCategory.growth > 0) {
          expect(growthSection).toBeTruthy();
          const growthCards = growthSection?.querySelectorAll('[data-category="growth"]');
          expect(growthCards?.length).toBe(featuresByCategory.growth);
        } else {
          expect(growthSection).toBeFalsy();
        }

        // Verify category order (automation -> analytics -> growth)
        const allSections = container.querySelectorAll('[data-testid^="category-"]');
        const sectionOrder = Array.from(allSections).map(section => 
          section.getAttribute('data-testid')?.replace('category-', '')
        );

        // Check that sections appear in the correct order
        const expectedOrder = ['automation', 'analytics', 'growth'].filter(
          cat => featuresByCategory[cat] > 0
        );
        expect(sectionOrder).toEqual(expectedOrder);
      }),
      { numRuns: 100 }
    );
  });

  it('should group all features with the same category together', () => {
    fc.assert(
      fc.property(featuresArrayArbitrary, (features) => {
        const { container } = render(<FeatureGrid features={features} />);

        // For each category, verify all features are in the same section
        const categories: Array<'automation' | 'analytics' | 'growth'> = ['automation', 'analytics', 'growth'];
        
        categories.forEach(category => {
          const categoryFeatures = features.filter(f => f.category === category);
          
          if (categoryFeatures.length > 0) {
            const categorySection = container.querySelector(`[data-testid="category-${category}"]`);
            expect(categorySection).toBeTruthy();

            // Verify all features in this category are present in the section
            categoryFeatures.forEach(feature => {
              const featureCard = categorySection?.querySelector(`[data-testid="feature-card-${feature.id}"]`);
              expect(featureCard).toBeTruthy();
              expect(featureCard?.getAttribute('data-category')).toBe(category);
            });
          }
        });
      }),
      { numRuns: 100 }
    );
  });

  it('should not mix features from different categories in the same section', () => {
    fc.assert(
      fc.property(featuresArrayArbitrary, (features) => {
        const { container } = render(<FeatureGrid features={features} />);

        const categories: Array<'automation' | 'analytics' | 'growth'> = ['automation', 'analytics', 'growth'];
        
        categories.forEach(category => {
          const categorySection = container.querySelector(`[data-testid="category-${category}"]`);
          
          if (categorySection) {
            // Get all feature cards in this section
            const cardsInSection = categorySection.querySelectorAll('[data-testid^="feature-card-"]');
            
            // Verify all cards have the correct category
            cardsInSection.forEach(card => {
              expect(card.getAttribute('data-category')).toBe(category);
            });
          }
        });
      }),
      { numRuns: 100 }
    );
  });
});
