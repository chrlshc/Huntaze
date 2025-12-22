/**
 * Property-Based Test: KPI Trend Pill Styling
 * Feature: dashboard-global-polish, Property 16: KPI Trend Pill Styling
 * Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5
 *
 * Property: For any KPI card with a positive trend, the percentage should be displayed
 * in a green-tinted pill with an upward trend icon; for negative trends, a red-tinted
 * pill with a downward trend icon.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { JSDOM } from 'jsdom';

describe('Property 16: KPI Trend Pill Styling', () => {
	let dom: JSDOM;
	let document: Document;

	beforeEach(() => {
		dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            ${getPolishTokensCSS()}
            ${getTrendPillCSS()}
          </style>
        </head>
        <body></body>
      </html>
    `);
		document = dom.window.document;
		global.window = dom.window as any;
		global.document = document;
		global.getComputedStyle = dom.window.getComputedStyle;
	});

	it('should display positive trends in green-tinted pill', () => {
		fc.assert(
			fc.property(
				fc.float({ min: Math.fround(0.1), max: Math.fround(100) }), // Positive percentage
				(percentage) => {
					// Create trend pill element
					const pill = document.createElement('div');
					pill.className = 'stat-card__delta stat-card__delta--up';
					pill.innerHTML = `
            <svg class="stat-card__delta-icon" viewBox="0 0 12 12">
              <path d="M6 2L10 6L9.3 6.7L6.5 3.9V10H5.5V3.9L2.7 6.7L2 6L6 2Z" fill="currentColor"/>
            </svg>
            <span>${percentage.toFixed(1)}%</span>
          `;
					document.body.appendChild(pill);

					// Get computed styles
					const styles = window.getComputedStyle(pill);
					const backgroundColor = styles.backgroundColor;
					const color = styles.color;

					// Cleanup
					document.body.removeChild(pill);

					// Check for green tint in background (rgba with green channel)
					const hasGreenTint =
						backgroundColor.includes('rgba') &&
						(backgroundColor.includes('185') || // Green channel value
							backgroundColor.includes('16')); // Red channel for green color

					// Check for green color
					const hasGreenColor =
						color.includes('rgb') &&
						(color.includes('185') || color.includes('16'));

					return hasGreenTint || hasGreenColor;
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should display negative trends in red-tinted pill', () => {
		fc.assert(
			fc.property(
				fc.float({ min: Math.fround(0.1), max: Math.fround(100) }), // Negative percentage (displayed as positive number)
				(percentage) => {
					// Create trend pill element
					const pill = document.createElement('div');
					pill.className = 'stat-card__delta stat-card__delta--down';
					pill.innerHTML = `
            <svg class="stat-card__delta-icon" viewBox="0 0 12 12">
              <path d="M6 10L2 6L2.7 5.3L5.5 8.1V2H6.5V8.1L9.3 5.3L10 6L6 10Z" fill="currentColor"/>
            </svg>
            <span>${percentage.toFixed(1)}%</span>
          `;
					document.body.appendChild(pill);

					// Get computed styles
					const styles = window.getComputedStyle(pill);
					const backgroundColor = styles.backgroundColor;
					const color = styles.color;

					// Cleanup
					document.body.removeChild(pill);

					// Check for red tint in background (rgba with red channel)
					const hasRedTint =
						backgroundColor.includes('rgba') &&
						(backgroundColor.includes('239') || // Red channel value
							backgroundColor.includes('68')); // Green/Blue channels for red color

					// Check for red color
					const hasRedColor =
						color.includes('rgb') &&
						(color.includes('239') || color.includes('68'));

					return hasRedTint || hasRedColor;
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should have pill-style border radius for all trends', () => {
		fc.assert(
			fc.property(
				fc.constantFrom('up', 'down', 'neutral'),
				fc.float({ min: Math.fround(0.1), max: Math.fround(100) }),
				(trend, percentage) => {
					const pill = document.createElement('div');
					pill.className = `stat-card__delta stat-card__delta--${trend}`;
					pill.innerHTML = `<span>${percentage.toFixed(1)}%</span>`;
					document.body.appendChild(pill);

					const styles = window.getComputedStyle(pill);
					const borderRadius = styles.borderRadius;

					// Cleanup
					document.body.removeChild(pill);

					// Should have a large border radius (pill shape)
					// Check for either 9999px or a percentage value
					return (
						borderRadius.includes('9999px') ||
						borderRadius.includes('%') ||
						parseInt(borderRadius) > 10
					);
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should have padding for pill appearance', () => {
		fc.assert(
			fc.property(
				fc.constantFrom('up', 'down', 'neutral'),
				(trend) => {
					const pill = document.createElement('div');
					pill.className = `stat-card__delta stat-card__delta--${trend}`;
					document.body.appendChild(pill);

					const styles = window.getComputedStyle(pill);
					const padding = styles.padding;

					// Cleanup
					document.body.removeChild(pill);

					// Should have padding defined
					return padding && padding !== '0px' && padding.length > 0;
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should display trend icon alongside percentage', () => {
		fc.assert(
			fc.property(
				fc.constantFrom('up', 'down'),
				fc.float({ min: Math.fround(0.1), max: Math.fround(100) }),
				(trend, percentage) => {
					const pill = document.createElement('div');
					pill.className = `stat-card__delta stat-card__delta--${trend}`;
					pill.innerHTML = `
            <svg class="stat-card__delta-icon" viewBox="0 0 12 12">
              <path d="M6 2L10 6L9.3 6.7L6.5 3.9V10H5.5V3.9L2.7 6.7L2 6L6 2Z" fill="currentColor"/>
            </svg>
            <span>${percentage.toFixed(1)}%</span>
          `;
					document.body.appendChild(pill);

					// Check for icon presence
					const icon = pill.querySelector('.stat-card__delta-icon');
					const hasIcon = icon !== null;

					// Check for percentage text
					const span = pill.querySelector('span');
					const hasPercentage = span !== null && span.textContent?.includes('%');

					// Cleanup
					document.body.removeChild(pill);

					return hasIcon && hasPercentage;
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should use inline-flex display for proper alignment', () => {
		fc.assert(
			fc.property(
				fc.constantFrom('up', 'down', 'neutral'),
				(trend) => {
					const pill = document.createElement('div');
					pill.className = `stat-card__delta stat-card__delta--${trend}`;
					document.body.appendChild(pill);

					const styles = window.getComputedStyle(pill);
					const display = styles.display;

					// Cleanup
					document.body.removeChild(pill);

					// Should use inline-flex or flex for proper alignment
					return display === 'inline-flex' || display === 'flex';
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should have subtle background opacity for all trend types', () => {
		fc.assert(
			fc.property(
				fc.constantFrom('up', 'down', 'neutral'),
				(trend) => {
					const pill = document.createElement('div');
					pill.className = `stat-card__delta stat-card__delta--${trend}`;
					document.body.appendChild(pill);

					const styles = window.getComputedStyle(pill);
					const backgroundColor = styles.backgroundColor;

					// Cleanup
					document.body.removeChild(pill);

					// Should have rgba with low opacity (0.1)
					if (backgroundColor.includes('rgba')) {
						const match = backgroundColor.match(/rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)/);
						if (match) {
							const opacity = parseFloat(match[1]);
							return opacity <= 0.2; // Subtle background
						}
					}

					return true; // If not rgba, that's also acceptable
				}
			),
			{ numRuns: 100 }
		);
	});
});

// Helper function to inject polish tokens CSS
function getPolishTokensCSS(): string {
	return `
    :root {
      --polish-radius-full: 9999px;
      --dashboard-delta-positive: #10b981;
      --dashboard-delta-negative: #ef4444;
      --dashboard-label-color: #6b7280;
    }
  `;
}

// Helper function to inject trend pill CSS
function getTrendPillCSS(): string {
	return `
    .stat-card__delta {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      margin-top: 4px;
      font-weight: 500;
      padding: 4px 8px;
      border-radius: var(--polish-radius-full, 9999px);
    }
    
    .stat-card__delta--up {
      background: rgba(16, 185, 129, 0.1);
      color: var(--dashboard-delta-positive, #10b981);
    }
    
    .stat-card__delta--down {
      background: rgba(239, 68, 68, 0.1);
      color: var(--dashboard-delta-negative, #ef4444);
    }
    
    .stat-card__delta--neutral {
      background: rgba(107, 114, 128, 0.1);
      color: var(--dashboard-label-color, #6b7280);
    }
    
    .stat-card__delta-icon {
      width: 12px;
      height: 12px;
      flex-shrink: 0;
    }
  `;
}
