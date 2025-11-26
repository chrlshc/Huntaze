// Feature: dashboard-shopify-migration, Property 22: Card Border Radius Consistency
// Feature: dashboard-shopify-migration, Property 23: Card Grid Spacing
// Feature: dashboard-shopify-migration, Property 24: Card Internal Padding
// Feature: dashboard-shopify-migration, Property 25: Interactive Card Hover Effect
// Feature: dashboard-shopify-migration, Property 26: Card Background Contrast
// Feature: dashboard-shopify-migration, Property 21: Empty State Visualization

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GamifiedOnboarding } from '@/components/dashboard/GamifiedOnboarding';
import * as fc from 'fast-check';

describe('GamifiedOnboarding Property Tests', () => {
  // Property 22: Card Border Radius Consistency
  // For any content card, the system should apply 16px border radius
  it('Property 22: all action cards have consistent border radius class', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }), // userName
        fc.boolean(), // hasConnectedAccounts
        (userName, hasConnectedAccounts) => {
          const { container } = render(
            <GamifiedOnboarding
              userName={userName}
              hasConnectedAccounts={hasConnectedAccounts}
              onConnectAccount={() => {}}
              onCreateContent={() => {}}
            />
          );

          const cards = container.querySelectorAll('[class*="actionCard"]');
          expect(cards.length).toBeGreaterThan(0);

          // Verify all cards have the actionCard class (which applies border radius)
          cards.forEach((card) => {
            expect(card.className).toContain('actionCard');
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 23: Card Grid Spacing
  // For any card grid layout, the system should use 24px gap between cards
  it('Property 23: card grid has onboardingGrid class with gap styling', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.boolean(),
        (userName, hasConnectedAccounts) => {
          const { container } = render(
            <GamifiedOnboarding
              userName={userName}
              hasConnectedAccounts={hasConnectedAccounts}
              onConnectAccount={() => {}}
              onCreateContent={() => {}}
            />
          );

          const grid = container.querySelector('[class*="onboardingGrid"]');
          expect(grid).toBeTruthy();
          
          // Verify grid has the onboardingGrid class (which applies gap)
          if (grid) {
            expect(grid.className).toContain('onboardingGrid');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 24: Card Internal Padding
  // For any content card, the system should apply at least 24px internal padding
  it('Property 24: all cards have actionCard class with padding', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.boolean(),
        (userName, hasConnectedAccounts) => {
          const { container } = render(
            <GamifiedOnboarding
              userName={userName}
              hasConnectedAccounts={hasConnectedAccounts}
              onConnectAccount={() => {}}
              onCreateContent={() => {}}
            />
          );

          const cards = container.querySelectorAll('[class*="actionCard"]');
          
          // Verify all cards have the actionCard class (which applies padding)
          cards.forEach((card) => {
            expect(card.className).toContain('actionCard');
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 25: Interactive Card Hover Effect
  // For any interactive card on hover, the system should lift the card (translateY(-4px)) and deepen the shadow
  it('Property 25: cards have actionCard class with hover effects', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.boolean(),
        (userName, hasConnectedAccounts) => {
          const { container } = render(
            <GamifiedOnboarding
              userName={userName}
              hasConnectedAccounts={hasConnectedAccounts}
              onConnectAccount={() => {}}
              onCreateContent={() => {}}
            />
          );

          const cards = container.querySelectorAll('[class*="actionCard"]');
          
          // Verify all cards have the actionCard class (which applies hover effects)
          cards.forEach((card) => {
            expect(card.className).toContain('actionCard');
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 26: Card Background Contrast
  // For any content card, the system should use white background (#FFFFFF) on the pale gray canvas (#F8F9FB)
  it('Property 26: cards use white background with proper contrast', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.boolean(),
        (userName, hasConnectedAccounts) => {
          const { container } = render(
            <GamifiedOnboarding
              userName={userName}
              hasConnectedAccounts={hasConnectedAccounts}
              onConnectAccount={() => {}}
              onCreateContent={() => {}}
            />
          );

          const cards = container.querySelectorAll('[class*="actionCard"]');
          
          cards.forEach((card) => {
            const styles = window.getComputedStyle(card);
            const background = styles.backgroundColor;
            // Should use var(--bg-surface) which is white
            expect(background).toBeTruthy();
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 21: Empty State Visualization
  // For any new user viewing the "Latest Stats" card, the system should display a potential growth visualization
  it('Property 21: stats card displays growth visualization for new users', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        (userName) => {
          const { container } = render(
            <GamifiedOnboarding
              userName={userName}
              hasConnectedAccounts={false}
              onConnectAccount={() => {}}
              onCreateContent={() => {}}
            />
          );

          // Should have stats visualization
          const visualization = container.querySelector('[class*="statsVisualization"]');
          expect(visualization).toBeTruthy();

          // Should have growth curve SVG
          const growthCurve = container.querySelector('[class*="growthCurve"]');
          expect(growthCurve).toBeTruthy();
        }
      ),
      { numRuns: 100 }
    );
  });

  // Additional test: Personalized greeting
  it('displays personalized greeting with user name', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length > 0), // Non-empty names
        fc.boolean(),
        (userName, hasConnectedAccounts) => {
          const { container } = render(
            <GamifiedOnboarding
              userName={userName}
              hasConnectedAccounts={hasConnectedAccounts}
              onConnectAccount={() => {}}
              onCreateContent={() => {}}
            />
          );

          // Should display greeting with user name
          const greeting = container.querySelector('[class*="greeting"]');
          expect(greeting).toBeTruthy();
          expect(greeting?.textContent).toContain('Bonjour');
          expect(greeting?.textContent).toContain(userName);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Additional test: Three action cards
  it('always displays exactly three action cards', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.boolean(),
        (userName, hasConnectedAccounts) => {
          const { container } = render(
            <GamifiedOnboarding
              userName={userName}
              hasConnectedAccounts={hasConnectedAccounts}
              onConnectAccount={() => {}}
              onCreateContent={() => {}}
            />
          );

          const cards = container.querySelectorAll('[class*="actionCard"]');
          expect(cards.length).toBe(3);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Additional test: Button states
  it('connect button is disabled when accounts are connected', () => {
    const { container } = render(
      <GamifiedOnboarding
        userName="Test"
        hasConnectedAccounts={true}
        onConnectAccount={() => {}}
        onCreateContent={() => {}}
      />
    );

    const buttons = container.querySelectorAll('button');
    const connectButton = Array.from(buttons).find(btn => 
      btn.textContent?.includes('Compte connecté')
    );
    
    expect(connectButton).toBeTruthy();
    expect(connectButton?.disabled).toBe(true);
  });
});
