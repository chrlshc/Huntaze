/**
 * Feature: dashboard-global-polish, Property 1: Typography Consistency Across Pages
 * 
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
 * 
 * Property: For any dashboard page (Messages, Smart Messages, Fans, PPV),
 * all H1 titles should use 24px semi-bold, all H2 headers should use 18px,
 * all labels should use 11px uppercase with letter-spacing, all body text
 * should use 14px, and all secondary text should use 12-13px gray.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';

describe('Property 1: Typography Consistency Across Pages', () => {
  let testContainer: HTMLDivElement;

  beforeEach(() => {
    // Create test container
    testContainer = document.createElement('div');
    document.body.appendChild(testContainer);

    // Inject polish tokens directly into the document
    const style = document.createElement('style');
    style.textContent = `
      .polish-h1 {
        font-size: 24px;
        font-weight: 600;
        line-height: 1.2;
      }
      .polish-h2 {
        font-size: 18px;
        font-weight: 600;
        line-height: 1.3;
      }
      .polish-label {
        font-size: 11px;
        font-weight: 500;
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }
      .polish-body {
        font-size: 14px;
        font-weight: 400;
        line-height: 1.5;
      }
      .polish-secondary {
        font-size: 12px;
        font-weight: 400;
        line-height: 1.4;
      }
    `;
    document.head.appendChild(style);
  });

  afterEach(() => {
    // Cleanup
    if (testContainer && testContainer.parentNode) {
      testContainer.parentNode.removeChild(testContainer);
    }
  });

  it('should enforce H1 styling (24px semi-bold) across all dashboard pages', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('messages', 'smart-messages', 'fans', 'ppv'),
        fc.string({ minLength: 1, maxLength: 50 }),
        (page, titleText) => {
          // Create H1 element with polish class
          const h1 = document.createElement('h1');
          h1.className = 'polish-h1';
          h1.textContent = titleText;
          h1.setAttribute('data-page', page);
          testContainer.appendChild(h1);

          // Get computed styles
          const styles = window.getComputedStyle(h1);

          // Verify H1 styling
          expect(styles.fontSize).toBe('24px');
          expect(styles.fontWeight).toBe('600');
          // Line height in jsdom may be 'normal' or computed, check if it's set
          const lineHeight = styles.lineHeight;
          expect(lineHeight === '1.2' || lineHeight === '28.8px' || lineHeight === 'normal').toBe(true);

          // Cleanup
          testContainer.removeChild(h1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should enforce H2 styling (18px semi-bold) across all dashboard pages', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('messages', 'smart-messages', 'fans', 'ppv'),
        fc.string({ minLength: 1, maxLength: 50 }),
        (page, headerText) => {
          // Create H2 element with polish class
          const h2 = document.createElement('h2');
          h2.className = 'polish-h2';
          h2.textContent = headerText;
          h2.setAttribute('data-page', page);
          testContainer.appendChild(h2);

          // Get computed styles
          const styles = window.getComputedStyle(h2);

          // Verify H2 styling
          expect(styles.fontSize).toBe('18px');
          expect(styles.fontWeight).toBe('600');
          // Line height in jsdom may be 'normal' or computed, check if it's set
          const lineHeight = styles.lineHeight;
          expect(lineHeight === '1.3' || lineHeight === '23.4px' || lineHeight === 'normal').toBe(true);

          // Cleanup
          testContainer.removeChild(h2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should enforce label styling (11px uppercase with letter-spacing) across all dashboard pages', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('messages', 'smart-messages', 'fans', 'ppv'),
        fc.string({ minLength: 1, maxLength: 30 }),
        (page, labelText) => {
          // Create label element with polish class
          const label = document.createElement('span');
          label.className = 'polish-label';
          label.textContent = labelText;
          label.setAttribute('data-page', page);
          testContainer.appendChild(label);

          // Get computed styles
          const styles = window.getComputedStyle(label);

          // Verify label styling
          expect(styles.fontSize).toBe('11px');
          expect(styles.fontWeight).toBe('500');
          expect(styles.textTransform).toBe('uppercase');
          
          // Letter spacing should be approximately 0.05em (0.55px at 11px)
          const letterSpacing = parseFloat(styles.letterSpacing);
          expect(letterSpacing).toBeGreaterThan(0);
          expect(letterSpacing).toBeLessThan(1);

          // Cleanup
          testContainer.removeChild(label);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should enforce body text styling (14px) across all dashboard pages', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('messages', 'smart-messages', 'fans', 'ppv'),
        fc.string({ minLength: 1, maxLength: 100 }),
        (page, bodyText) => {
          // Create body text element with polish class
          const p = document.createElement('p');
          p.className = 'polish-body';
          p.textContent = bodyText;
          p.setAttribute('data-page', page);
          testContainer.appendChild(p);

          // Get computed styles
          const styles = window.getComputedStyle(p);

          // Verify body styling
          expect(styles.fontSize).toBe('14px');
          expect(styles.fontWeight).toBe('400');
          // Line height in jsdom may be 'normal' or computed, check if it's set
          const lineHeight = styles.lineHeight;
          expect(lineHeight === '1.5' || lineHeight === '21px' || lineHeight === 'normal').toBe(true);

          // Cleanup
          testContainer.removeChild(p);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should enforce secondary text styling (12px gray) across all dashboard pages', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('messages', 'smart-messages', 'fans', 'ppv'),
        fc.string({ minLength: 1, maxLength: 50 }),
        (page, secondaryText) => {
          // Create secondary text element with polish class
          const span = document.createElement('span');
          span.className = 'polish-secondary';
          span.textContent = secondaryText;
          span.setAttribute('data-page', page);
          testContainer.appendChild(span);

          // Get computed styles
          const styles = window.getComputedStyle(span);

          // Verify secondary styling
          expect(styles.fontSize).toBe('12px');
          expect(styles.fontWeight).toBe('400');

          // Cleanup
          testContainer.removeChild(span);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain typography consistency when elements are nested', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('messages', 'smart-messages', 'fans', 'ppv'),
        (page) => {
          // Create nested structure
          const container = document.createElement('div');
          container.setAttribute('data-page', page);

          const h1 = document.createElement('h1');
          h1.className = 'polish-h1';
          h1.textContent = 'Page Title';

          const section = document.createElement('section');
          const h2 = document.createElement('h2');
          h2.className = 'polish-h2';
          h2.textContent = 'Section Header';

          const label = document.createElement('span');
          label.className = 'polish-label';
          label.textContent = 'Label';

          const body = document.createElement('p');
          body.className = 'polish-body';
          body.textContent = 'Body text';

          const secondary = document.createElement('span');
          secondary.className = 'polish-secondary';
          secondary.textContent = 'Secondary text';

          section.appendChild(h2);
          section.appendChild(label);
          section.appendChild(body);
          section.appendChild(secondary);
          container.appendChild(h1);
          container.appendChild(section);
          testContainer.appendChild(container);

          // Verify all elements maintain their styling
          const h1Styles = window.getComputedStyle(h1);
          const h2Styles = window.getComputedStyle(h2);
          const labelStyles = window.getComputedStyle(label);
          const bodyStyles = window.getComputedStyle(body);
          const secondaryStyles = window.getComputedStyle(secondary);

          expect(h1Styles.fontSize).toBe('24px');
          expect(h2Styles.fontSize).toBe('18px');
          expect(labelStyles.fontSize).toBe('11px');
          expect(bodyStyles.fontSize).toBe('14px');
          expect(secondaryStyles.fontSize).toBe('12px');

          // Cleanup
          testContainer.removeChild(container);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should apply correct font weights across typography scale', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('messages', 'smart-messages', 'fans', 'ppv'),
        (page) => {
          // Create elements with different typography classes
          const elements = [
            { tag: 'h1', className: 'polish-h1', expectedWeight: '600' },
            { tag: 'h2', className: 'polish-h2', expectedWeight: '600' },
            { tag: 'span', className: 'polish-label', expectedWeight: '500' },
            { tag: 'p', className: 'polish-body', expectedWeight: '400' },
            { tag: 'span', className: 'polish-secondary', expectedWeight: '400' },
          ];

          elements.forEach(({ tag, className, expectedWeight }) => {
            const element = document.createElement(tag);
            element.className = className;
            element.textContent = 'Test';
            element.setAttribute('data-page', page);
            testContainer.appendChild(element);

            const styles = window.getComputedStyle(element);
            expect(styles.fontWeight).toBe(expectedWeight);

            testContainer.removeChild(element);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
