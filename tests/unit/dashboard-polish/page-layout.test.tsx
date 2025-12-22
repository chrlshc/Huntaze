/**
 * PageLayout Component Tests
 * 
 * Verifies the PageLayout component structure, props, and rendering
 * according to dashboard-global-polish specifications.
 * 
 * Feature: dashboard-global-polish
 * Validates: Requirements 1.1, 1.2, 1.4, 2.4, 12.5
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageLayout } from '../../../components/ui/PageLayout';

describe('PageLayout Component', () => {
  describe('Basic Structure', () => {
    it('should render with title only', () => {
      render(
        <PageLayout title="Test Page">
          <div>Content</div>
        </PageLayout>
      );

      expect(screen.getByTestId('page-layout')).toBeInTheDocument();
      expect(screen.getByTestId('page-layout-header')).toBeInTheDocument();
      expect(screen.getByTestId('page-layout-title')).toHaveTextContent('Test Page');
      expect(screen.getByTestId('page-layout-content')).toBeInTheDocument();
    });

    it('should render subtitle when provided', () => {
      render(
        <PageLayout title="Test Page" subtitle="SECTION">
          <div>Content</div>
        </PageLayout>
      );

      const subtitle = screen.getByTestId('page-layout-subtitle');
      expect(subtitle).toBeInTheDocument();
      expect(subtitle).toHaveTextContent('SECTION');
    });

    it('should not render subtitle when not provided', () => {
      render(
        <PageLayout title="Test Page">
          <div>Content</div>
        </PageLayout>
      );

      expect(screen.queryByTestId('page-layout-subtitle')).not.toBeInTheDocument();
    });

    it('should render actions when provided', () => {
      render(
        <PageLayout 
          title="Test Page" 
          actions={<button>Action Button</button>}
        >
          <div>Content</div>
        </PageLayout>
      );

      const actions = screen.getByTestId('page-layout-actions');
      expect(actions).toBeInTheDocument();
      expect(screen.getByText('Action Button')).toBeInTheDocument();
    });

    it('should not render actions when not provided', () => {
      render(
        <PageLayout title="Test Page">
          <div>Content</div>
        </PageLayout>
      );

      expect(screen.queryByTestId('page-layout-actions')).not.toBeInTheDocument();
    });

    it('should render filters when provided', () => {
      render(
        <PageLayout 
          title="Test Page" 
          filters={<div>Filter Controls</div>}
        >
          <div>Content</div>
        </PageLayout>
      );

      const filters = screen.getByTestId('page-layout-filters');
      expect(filters).toBeInTheDocument();
      expect(screen.getByText('Filter Controls')).toBeInTheDocument();
    });

    it('should not render filters when not provided', () => {
      render(
        <PageLayout title="Test Page">
          <div>Content</div>
        </PageLayout>
      );

      expect(screen.queryByTestId('page-layout-filters')).not.toBeInTheDocument();
    });

    it('should render children in content area', () => {
      render(
        <PageLayout title="Test Page">
          <div data-testid="child-content">Child Content</div>
        </PageLayout>
      );

      const content = screen.getByTestId('page-layout-content');
      expect(content).toBeInTheDocument();
      expect(screen.getByTestId('child-content')).toBeInTheDocument();
    });
  });

  describe('Typography Requirements (Req 1.1, 1.2, 1.4)', () => {
    it('should apply H1 styling to title', () => {
      render(
        <PageLayout title="Test Page">
          <div>Content</div>
        </PageLayout>
      );

      const title = screen.getByTestId('page-layout-title');
      expect(title.tagName).toBe('H1');
      expect(title).toHaveClass('page-layout-title');
    });

    it('should apply label styling to subtitle', () => {
      render(
        <PageLayout title="Test Page" subtitle="SECTION">
          <div>Content</div>
        </PageLayout>
      );

      const subtitle = screen.getByTestId('page-layout-subtitle');
      expect(subtitle.tagName).toBe('SPAN');
      expect(subtitle).toHaveClass('page-layout-subtitle');
    });
  });

  describe('Spacing Requirements (Req 2.4)', () => {
    it('should have proper header structure', () => {
      render(
        <PageLayout title="Test Page">
          <div>Content</div>
        </PageLayout>
      );

      const header = screen.getByTestId('page-layout-header');
      expect(header.tagName).toBe('HEADER');
      expect(header).toHaveClass('page-layout-header');
    });

    it('should have proper content structure', () => {
      render(
        <PageLayout title="Test Page">
          <div>Content</div>
        </PageLayout>
      );

      const content = screen.getByTestId('page-layout-content');
      expect(content.tagName).toBe('MAIN');
      expect(content).toHaveClass('page-layout-content');
    });
  });

  describe('Complete Layout (Req 12.5)', () => {
    it('should render all sections when all props provided', () => {
      render(
        <PageLayout
          title="Test Page"
          subtitle="SECTION"
          actions={<button>Action</button>}
          filters={<div>Filters</div>}
        >
          <div>Content</div>
        </PageLayout>
      );

      expect(screen.getByTestId('page-layout')).toBeInTheDocument();
      expect(screen.getByTestId('page-layout-header')).toBeInTheDocument();
      expect(screen.getByTestId('page-layout-subtitle')).toBeInTheDocument();
      expect(screen.getByTestId('page-layout-title')).toBeInTheDocument();
      expect(screen.getByTestId('page-layout-actions')).toBeInTheDocument();
      expect(screen.getByTestId('page-layout-filters')).toBeInTheDocument();
      expect(screen.getByTestId('page-layout-content')).toBeInTheDocument();
    });

    it('should apply custom className when provided', () => {
      render(
        <PageLayout title="Test Page" className="custom-class">
          <div>Content</div>
        </PageLayout>
      );

      const layout = screen.getByTestId('page-layout');
      expect(layout).toHaveClass('page-layout');
      expect(layout).toHaveClass('custom-class');
    });
  });

  describe('Accessibility', () => {
    it('should use semantic HTML elements', () => {
      render(
        <PageLayout title="Test Page">
          <div>Content</div>
        </PageLayout>
      );

      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should have proper heading hierarchy', () => {
      render(
        <PageLayout title="Test Page">
          <div>Content</div>
        </PageLayout>
      );

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Test Page');
    });
  });
});
