/**
 * Card Component Tests
 * 
 * Tests for the updated Card component using design tokens
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Card } from '@/components/ui/card';

describe('Card Component', () => {
  it('renders with default variant', () => {
    const { container } = render(<Card>Test content</Card>);
    const card = container.firstChild as HTMLElement;
    
    expect(card).toBeTruthy();
    expect(card.textContent).toBe('Test content');
  });

  it('renders with glass variant', () => {
    const { container } = render(<Card variant="glass">Glass content</Card>);
    const card = container.firstChild as HTMLElement;
    
    expect(card).toBeTruthy();
    expect(card.className).toContain('glass-card');
  });

  it('accepts custom className', () => {
    const { container } = render(<Card className="custom-class">Content</Card>);
    const card = container.firstChild as HTMLElement;
    
    expect(card.className).toContain('custom-class');
  });

  it('forwards HTML attributes', () => {
    const { container } = render(
      <Card data-testid="test-card" id="my-card">Content</Card>
    );
    const card = container.firstChild as HTMLElement;
    
    expect(card.getAttribute('data-testid')).toBe('test-card');
    expect(card.id).toBe('my-card');
  });

  it('uses design token classes', () => {
    const { container } = render(<Card>Content</Card>);
    const card = container.firstChild as HTMLElement;
    
    // Check that the component uses CSS custom properties
    const className = card.className;
    
    // Should use design token CSS variables
    expect(className).toMatch(/var\(--/);
  });
});
