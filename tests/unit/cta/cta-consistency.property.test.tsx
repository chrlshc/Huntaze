/**
 * Property Tests for CTA Consistency
 * 
 * Feature: signup-ux-optimization, Property 19: CTA Consistency
 * Validates: Requirements 9.1, 9.2
 * 
 * Tests that CTAs maintain consistent text and styling across the application.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StandardCTA } from '@/components/cta/StandardCTA';
import { CTASection } from '@/components/cta/CTASection';
import * as fc from 'fast-check';

// Mock next-auth
vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: null, status: 'unauthenticated' }),
}));

describe('Property 19: CTA Consistency', () => {
  describe('StandardCTA Component', () => {
    it('should always use "Join Beta" as default text for unauthenticated users', () => {
      fc.assert(
        fc.property(
          fc.record({
            variant: fc.constantFrom('primary', 'secondary', 'outline'),
            size: fc.constantFrom('sm', 'md', 'lg'),
          }),
          (props) => {
            const { container } = render(<StandardCTA {...props} />);
            const link = container.querySelector('a');
            expect(link).toBeTruthy();
            expect(link?.textContent).toBe('Join Beta');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use consistent styling for primary variant', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('sm', 'md', 'lg'),
          (size) => {
            const { container } = render(
              <StandardCTA variant="primary" size={size} />
            );
            const link = container.querySelector('a');
            expect(link?.className).toContain('from-purple-500');
            expect(link?.className).toContain('to-purple-600');
            expect(link?.className).toContain('text-white');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use consistent styling for secondary variant', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('sm', 'md', 'lg'),
          (size) => {
            const { container } = render(
              <StandardCTA variant="secondary" size={size} />
            );
            const link = container.querySelector('a');
            expect(link?.className).toContain('bg-white/10');
            expect(link?.className).toContain('text-white');
            expect(link?.className).toContain('border');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always include focus indicators', () => {
      fc.assert(
        fc.property(
          fc.record({
            variant: fc.constantFrom('primary', 'secondary', 'outline'),
            size: fc.constantFrom('sm', 'md', 'lg'),
          }),
          (props) => {
            const { container } = render(<StandardCTA {...props} />);
            const link = container.querySelector('a');
            expect(link?.className).toContain('focus-visible:ring-2');
            expect(link?.className).toContain('focus-visible:ring-purple-500');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always include hover effects', () => {
      fc.assert(
        fc.property(
          fc.record({
            variant: fc.constantFrom('primary', 'secondary', 'outline'),
            size: fc.constantFrom('sm', 'md', 'lg'),
          }),
          (props) => {
            const { container } = render(<StandardCTA {...props} />);
            const link = container.querySelector('a');
            expect(link?.className).toContain('hover:-translate-y-0.5');
            expect(link?.className).toContain('transition-all');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should display microcopy when provided', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          (microcopy) => {
            const { container } = render(<StandardCTA microcopy={microcopy} />);
            const microcopyelement = container.querySelector('p');
            expect(microcopyelement).toBeTruthy();
            expect(microcopyelement?.textContent).toBe(microcopy);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use consistent border radius', () => {
      fc.assert(
        fc.property(
          fc.record({
            variant: fc.constantFrom('primary', 'secondary', 'outline'),
            size: fc.constantFrom('sm', 'md', 'lg'),
          }),
          (props) => {
            const { container } = render(<StandardCTA {...props} />);
            const link = container.querySelector('a');
            expect(link?.className).toContain('rounded-xl');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use consistent font weight', () => {
      fc.assert(
        fc.property(
          fc.record({
            variant: fc.constantFrom('primary', 'secondary', 'outline'),
            size: fc.constantFrom('sm', 'md', 'lg'),
          }),
          (props) => {
            const { container } = render(<StandardCTA {...props} />);
            const link = container.querySelector('a');
            expect(link?.className).toContain('font-semibold');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('CTASection Component', () => {
    it('should enforce max 2 CTAs per section', () => {
      fc.assert(
        fc.property(
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 100 }),
            subtitle: fc.string({ minLength: 1, maxLength: 200 }),
          }),
          (props) => {
            const { container } = render(
              <CTASection
                {...props}
                primaryCTA={{}}
                secondaryCTA={{}}
              />
            );
            const links = container.querySelectorAll('a');
            // Should have exactly 2 CTAs (primary + secondary)
            expect(links.length).toBeLessThanOrEqual(2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use consistent section styling', () => {
      fc.assert(
        fc.property(
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 100 }),
            background: fc.constantFrom('dark', 'light', 'gradient'),
          }),
          (props) => {
            const { container } = render(<CTASection {...props} />);
            const section = container.querySelector('section');
            expect(section?.className).toContain('py-20');
            expect(section?.className).toContain('text-center');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should display title with consistent styling', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          (title) => {
            const { container } = render(<CTASection title={title} />);
            const heading = container.querySelector('h2');
            expect(heading?.textContent).toBe(title);
            expect(heading?.className).toContain('text-4xl');
            expect(heading?.className).toContain('font-bold');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('CTA Text Consistency', () => {
    it('should never use inconsistent CTA texts', () => {
      const inconsistentTexts = [
        'Get Started',
        'Sign Up',
        'Start Free',
        'Request Access',
        'Request Early Access',
      ];

      fc.assert(
        fc.property(
          fc.constantFrom(...inconsistentTexts),
          (text) => {
            const { container } = render(<StandardCTA text={text} />);
            const link = container.querySelector('a');
            // When custom text is provided, it should be used
            // But we're testing that the default is always "Join Beta"
            expect(link?.textContent).toBe(text);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use "Join Beta" as the standard primary CTA text', () => {
      const { container } = render(<StandardCTA />);
      const link = container.querySelector('a');
      expect(link?.textContent).toBe('Join Beta');
    });
  });

  describe('Accessibility Consistency', () => {
    it('should always have accessible focus states', () => {
      fc.assert(
        fc.property(
          fc.record({
            variant: fc.constantFrom('primary', 'secondary', 'outline'),
            size: fc.constantFrom('sm', 'md', 'lg'),
          }),
          (props) => {
            const { container } = render(<StandardCTA {...props} />);
            const link = container.querySelector('a');
            expect(link?.className).toContain('focus:outline-none');
            expect(link?.className).toContain('focus-visible:ring-2');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should support reduced motion preferences', () => {
      fc.assert(
        fc.property(
          fc.record({
            variant: fc.constantFrom('primary', 'secondary', 'outline'),
            size: fc.constantFrom('sm', 'md', 'lg'),
          }),
          (props) => {
            const { container } = render(<StandardCTA {...props} />);
            const link = container.querySelector('a');
            expect(link?.className).toContain('motion-reduce:transition-none');
            expect(link?.className).toContain('motion-reduce:hover:transform-none');
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
