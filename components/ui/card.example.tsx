/**
 * Card Component - Usage Examples
 * 
 * This file demonstrates how to use the updated Card component
 * with design tokens for consistent styling across the application.
 */

import { Card } from './card';

// Example 1: Default Card (solid background)
export function DefaultCardExample() {
  return (
    <Card>
      <h3 className="text-[var(--text-primary)] text-[var(--text-xl)] font-[var(--font-weight-semibold)]">
        Default Card
      </h3>
      <p className="text-[var(--text-primary)] mt-[var(--space-2)]">
        This card uses the default variant with solid background (--bg-tertiary)
        and subtle borders (--border-subtle).
      </p>
    </Card>
  );
}

// Example 2: Glass Effect Card
export function GlassCardExample() {
  return (
    <Card variant="glass">
      <h3 className="text-[var(--text-primary)] text-[var(--text-xl)] font-[var(--font-weight-semibold)]">
        Glass Effect Card
      </h3>
      <p className="text-[var(--text-primary)] mt-[var(--space-2)]">
        This card uses the glass variant with backdrop blur and translucent background.
        Perfect for overlays and premium UI elements.
      </p>
    </Card>
  );
}

// Example 3: Custom Styling with Design Tokens
export function CustomStyledCardExample() {
  return (
    <Card 
      className="border-[var(--accent-primary)] shadow-[var(--shadow-accent)]"
    >
      <h3 className="text-[var(--accent-primary)] text-[var(--text-xl)] font-[var(--font-weight-semibold)]">
        Accent Card
      </h3>
      <p className="text-[var(--text-primary)] mt-[var(--space-2)]">
        You can still customize cards using design tokens for special cases.
      </p>
    </Card>
  );
}

// Example 4: Interactive Card with Hover
export function InteractiveCardExample() {
  return (
    <Card 
      className="cursor-pointer"
      onClick={() => console.log('Card clicked')}
    >
      <h3 className="text-[var(--text-primary)] text-[var(--text-xl)] font-[var(--font-weight-semibold)]">
        Interactive Card
      </h3>
      <p className="text-[var(--text-primary)] mt-[var(--space-2)]">
        Hover over this card to see the smooth transition effects using design tokens.
      </p>
    </Card>
  );
}

// Example 5: Card Grid Layout
export function CardGridExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[var(--space-6)]">
      <Card>
        <h4 className="text-[var(--text-primary)] font-[var(--font-weight-semibold)]">Card 1</h4>
        <p className="text-[var(--text-primary)] text-[var(--text-sm)] mt-[var(--space-2)]">
          Consistent spacing using design tokens
        </p>
      </Card>
      <Card variant="glass">
        <h4 className="text-[var(--text-primary)] font-[var(--font-weight-semibold)]">Card 2</h4>
        <p className="text-[var(--text-primary)] text-[var(--text-sm)] mt-[var(--space-2)]">
          Glass effect variant
        </p>
      </Card>
      <Card>
        <h4 className="text-[var(--text-primary)] font-[var(--font-weight-semibold)]">Card 3</h4>
        <p className="text-[var(--text-primary)] text-[var(--text-sm)] mt-[var(--space-2)]">
          Responsive grid layout
        </p>
      </Card>
    </div>
  );
}
