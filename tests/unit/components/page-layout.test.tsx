/**
 * PageLayout Component - Unit Tests
 * 
 * Tests for the PageLayout component to ensure it renders correctly
 * with various props and uses design tokens appropriately.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageLayout } from '@/components/ui/page-layout';
import React from 'react';

describe('PageLayout Component', () => {
  it('renders without crashing', () => {
    render(
      <PageLayout>
        <div>Test content</div>
      </PageLayout>
    );
    
    expect(screen.getByTestId('page-layout')).toBeInTheDocument();
  });

  it('renders children content', () => {
    render(
      <PageLayout>
        <div data-testid="test-child">Test content</div>
      </PageLayout>
    );
    
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(
      <PageLayout title="Test Title">
        <div>Content</div>
      </PageLayout>
    );
    
    expect(screen.getByTestId('page-layout-title')).toBeInTheDocument();
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(
      <PageLayout subtitle="Test Subtitle">
        <div>Content</div>
      </PageLayout>
    );
    
    expect(screen.getByTestId('page-layout-subtitle')).toBeInTheDocument();
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
  });

  it('renders both title and subtitle', () => {
    render(
      <PageLayout title="Test Title" subtitle="Test Subtitle">
        <div>Content</div>
      </PageLayout>
    );
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
  });

  it('renders actions when provided', () => {
    render(
      <PageLayout
        title="Test"
        actions={<button data-testid="test-action">Action</button>}
      >
        <div>Content</div>
      </PageLayout>
    );
    
    expect(screen.getByTestId('page-layout-actions')).toBeInTheDocument();
    expect(screen.getByTestId('test-action')).toBeInTheDocument();
  });

  it('does not render header when no title, subtitle, or actions provided', () => {
    render(
      <PageLayout>
        <div>Content</div>
      </PageLayout>
    );
    
    expect(screen.queryByTestId('page-layout-header')).not.toBeInTheDocument();
  });

  it('renders header when only title is provided', () => {
    render(
      <PageLayout title="Test">
        <div>Content</div>
      </PageLayout>
    );
    
    expect(screen.getByTestId('page-layout-header')).toBeInTheDocument();
  });

  it('renders header when only subtitle is provided', () => {
    render(
      <PageLayout subtitle="Test">
        <div>Content</div>
      </PageLayout>
    );
    
    expect(screen.getByTestId('page-layout-header')).toBeInTheDocument();
  });

  it('renders header when only actions are provided', () => {
    render(
      <PageLayout actions={<button>Action</button>}>
        <div>Content</div>
      </PageLayout>
    );
    
    expect(screen.getByTestId('page-layout-header')).toBeInTheDocument();
  });

  it('applies custom className to root element', () => {
    render(
      <PageLayout className="custom-class">
        <div>Content</div>
      </PageLayout>
    );
    
    const layout = screen.getByTestId('page-layout');
    expect(layout).toHaveClass('custom-class');
  });

  it('applies custom headerClassName to header element', () => {
    render(
      <PageLayout title="Test" headerClassName="custom-header">
        <div>Content</div>
      </PageLayout>
    );
    
    const header = screen.getByTestId('page-layout-header');
    expect(header).toHaveClass('custom-header');
  });

  it('applies custom contentClassName to content element', () => {
    render(
      <PageLayout contentClassName="custom-content">
        <div>Content</div>
      </PageLayout>
    );
    
    const content = screen.getByTestId('page-layout-content');
    expect(content).toHaveClass('custom-content');
  });

  it('uses design token for title font size', () => {
    render(
      <PageLayout title="Test Title">
        <div>Content</div>
      </PageLayout>
    );
    
    const title = screen.getByTestId('page-layout-title');
    const styles = window.getComputedStyle(title);
    expect(title.style.fontSize).toBe('var(--text-3xl)');
  });

  it('uses design token for title font weight', () => {
    render(
      <PageLayout title="Test Title">
        <div>Content</div>
      </PageLayout>
    );
    
    const title = screen.getByTestId('page-layout-title');
    expect(title.style.fontWeight).toBe('var(--font-weight-bold)');
  });

  it('uses design token for title color', () => {
    render(
      <PageLayout title="Test Title">
        <div>Content</div>
      </PageLayout>
    );
    
    const title = screen.getByTestId('page-layout-title');
    expect(title.style.color).toBe('var(--text-primary)');
  });

  it('uses design token for subtitle font size', () => {
    render(
      <PageLayout subtitle="Test Subtitle">
        <div>Content</div>
      </PageLayout>
    );
    
    const subtitle = screen.getByTestId('page-layout-subtitle');
    expect(subtitle.style.fontSize).toBe('var(--text-base)');
  });

  it('uses design token for subtitle color', () => {
    render(
      <PageLayout subtitle="Test Subtitle">
        <div>Content</div>
      </PageLayout>
    );
    
    const subtitle = screen.getByTestId('page-layout-subtitle');
    expect(subtitle.style.color).toBe('var(--text-secondary)');
  });

  it('uses design token for spacing between elements', () => {
    render(
      <PageLayout title="Test" subtitle="Subtitle">
        <div>Content</div>
      </PageLayout>
    );
    
    const layout = screen.getByTestId('page-layout');
    expect(layout.style.gap).toBe('var(--space-6)');
  });

  it('renders title as h1 element', () => {
    render(
      <PageLayout title="Test Title">
        <div>Content</div>
      </PageLayout>
    );
    
    const title = screen.getByTestId('page-layout-title');
    expect(title.tagName).toBe('H1');
  });

  it('renders subtitle as p element', () => {
    render(
      <PageLayout subtitle="Test Subtitle">
        <div>Content</div>
      </PageLayout>
    );
    
    const subtitle = screen.getByTestId('page-layout-subtitle');
    expect(subtitle.tagName).toBe('P');
  });

  it('renders content in main element', () => {
    render(
      <PageLayout>
        <div>Content</div>
      </PageLayout>
    );
    
    const content = screen.getByTestId('page-layout-content');
    expect(content.tagName).toBe('MAIN');
  });

  it('renders header in header element', () => {
    render(
      <PageLayout title="Test">
        <div>Content</div>
      </PageLayout>
    );
    
    const header = screen.getByTestId('page-layout-header');
    expect(header.tagName).toBe('HEADER');
  });

  it('handles multiple action elements', () => {
    render(
      <PageLayout
        title="Test"
        actions={
          <>
            <button data-testid="action-1">Action 1</button>
            <button data-testid="action-2">Action 2</button>
            <button data-testid="action-3">Action 3</button>
          </>
        }
      >
        <div>Content</div>
      </PageLayout>
    );
    
    expect(screen.getByTestId('action-1')).toBeInTheDocument();
    expect(screen.getByTestId('action-2')).toBeInTheDocument();
    expect(screen.getByTestId('action-3')).toBeInTheDocument();
  });

  it('maintains responsive layout with flexbox', () => {
    render(
      <PageLayout title="Test" subtitle="Subtitle" actions={<button>Action</button>}>
        <div>Content</div>
      </PageLayout>
    );
    
    const layout = screen.getByTestId('page-layout');
    expect(layout.style.display).toBe('flex');
    expect(layout.style.flexDirection).toBe('column');
  });

  it('sets width to 100%', () => {
    render(
      <PageLayout>
        <div>Content</div>
      </PageLayout>
    );
    
    const layout = screen.getByTestId('page-layout');
    expect(layout.style.width).toBe('100%');
  });

  it('allows content to grow with flex', () => {
    render(
      <PageLayout>
        <div>Content</div>
      </PageLayout>
    );
    
    const content = screen.getByTestId('page-layout-content');
    expect(content.style.flex).toBe('1 1 auto');
  });
});
