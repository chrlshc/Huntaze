/**
 * Container Component - Unit Tests
 * 
 * Tests for the Container layout component
 * Validates: Requirements 5.1, 5.2, 7.1, 7.2
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Container } from '@/components/ui/container';
import React from 'react';

describe('Container Component', () => {
  it('renders children correctly', () => {
    render(
      <Container>
        <div>Test Content</div>
      </Container>
    );
    
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
  
  it('applies default max-width (lg)', () => {
    render(
      <Container>
        <div>Content</div>
      </Container>
    );
    
    const container = screen.getByTestId('container');
    expect(container).toHaveAttribute('data-max-width', 'lg');
  });
  
  it('applies custom max-width variants', () => {
    const { rerender } = render(
      <Container maxWidth="sm">
        <div>Content</div>
      </Container>
    );
    
    let container = screen.getByTestId('container');
    expect(container).toHaveAttribute('data-max-width', 'sm');
    
    rerender(
      <Container maxWidth="xl">
        <div>Content</div>
      </Container>
    );
    
    container = screen.getByTestId('container');
    expect(container).toHaveAttribute('data-max-width', 'xl');
  });
  
  it('applies default padding (md)', () => {
    render(
      <Container>
        <div>Content</div>
      </Container>
    );
    
    const container = screen.getByTestId('container');
    expect(container).toHaveAttribute('data-padding', 'md');
  });
  
  it('applies custom padding variants', () => {
    const { rerender } = render(
      <Container padding="none">
        <div>Content</div>
      </Container>
    );
    
    let container = screen.getByTestId('container');
    expect(container).toHaveAttribute('data-padding', 'none');
    
    rerender(
      <Container padding="lg">
        <div>Content</div>
      </Container>
    );
    
    container = screen.getByTestId('container');
    expect(container).toHaveAttribute('data-padding', 'lg');
  });
  
  it('centers container by default', () => {
    render(
      <Container>
        <div>Content</div>
      </Container>
    );
    
    const container = screen.getByTestId('container');
    const styles = window.getComputedStyle(container);
    
    // Check that margin auto is applied for centering
    expect(container.style.marginLeft).toBe('auto');
    expect(container.style.marginRight).toBe('auto');
  });
  
  it('does not center when centered={false}', () => {
    render(
      <Container centered={false}>
        <div>Content</div>
      </Container>
    );
    
    const container = screen.getByTestId('container');
    
    // Should not have margin auto
    expect(container.style.marginLeft).not.toBe('auto');
    expect(container.style.marginRight).not.toBe('auto');
  });
  
  it('renders as different HTML elements', () => {
    const { rerender } = render(
      <Container as="section">
        <div>Content</div>
      </Container>
    );
    
    let container = screen.getByTestId('container');
    expect(container.tagName).toBe('SECTION');
    
    rerender(
      <Container as="article">
        <div>Content</div>
      </Container>
    );
    
    container = screen.getByTestId('container');
    expect(container.tagName).toBe('ARTICLE');
    
    rerender(
      <Container as="main">
        <div>Content</div>
      </Container>
    );
    
    container = screen.getByTestId('container');
    expect(container.tagName).toBe('MAIN');
  });
  
  it('applies custom className', () => {
    render(
      <Container className="custom-class glass-card">
        <div>Content</div>
      </Container>
    );
    
    const container = screen.getByTestId('container');
    expect(container).toHaveClass('custom-class');
    expect(container).toHaveClass('glass-card');
  });
  
  it('uses design token CSS variables for max-width', () => {
    const { rerender } = render(
      <Container maxWidth="sm">
        <div>Content</div>
      </Container>
    );
    
    let container = screen.getByTestId('container');
    expect(container.style.maxWidth).toBe('var(--content-max-width-sm)');
    
    rerender(
      <Container maxWidth="lg">
        <div>Content</div>
      </Container>
    );
    
    container = screen.getByTestId('container');
    expect(container.style.maxWidth).toBe('var(--content-max-width-lg)');
  });
  
  it('uses design token CSS variables for padding', () => {
    const { rerender } = render(
      <Container padding="sm">
        <div>Content</div>
      </Container>
    );
    
    let container = screen.getByTestId('container');
    expect(container.style.padding).toBe('var(--space-4)');
    
    rerender(
      <Container padding="md">
        <div>Content</div>
      </Container>
    );
    
    container = screen.getByTestId('container');
    expect(container.style.padding).toBe('var(--space-6)');
    
    rerender(
      <Container padding="lg">
        <div>Content</div>
      </Container>
    );
    
    container = screen.getByTestId('container');
    expect(container.style.padding).toBe('var(--space-8)');
  });
  
  it('handles full-width variant correctly', () => {
    render(
      <Container maxWidth="full">
        <div>Content</div>
      </Container>
    );
    
    const container = screen.getByTestId('container');
    expect(container.style.maxWidth).toBe('100%');
  });
  
  it('handles no padding variant correctly', () => {
    render(
      <Container padding="none">
        <div>Content</div>
      </Container>
    );
    
    const container = screen.getByTestId('container');
    // Browser may add 'px' unit
    expect(container.style.padding).toMatch(/^0(px)?$/);
  });
  
  it('always sets width to 100%', () => {
    render(
      <Container>
        <div>Content</div>
      </Container>
    );
    
    const container = screen.getByTestId('container');
    expect(container.style.width).toBe('100%');
  });
});
