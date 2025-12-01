/**
 * PageLayout Component - Usage Examples
 * 
 * Demonstrates various use cases for the PageLayout component
 */

import React from 'react';
import { PageLayout } from './page-layout';
import { Card } from './card';
import { Container } from './container';
import { Button } from "@/components/ui/button";

/**
 * Example 1: Basic page with title only
 */
export function BasicPageExample() {
  return (
    <PageLayout title="Dashboard">
      <Card>
        <p>Simple page content with just a title</p>
      </Card>
    </PageLayout>
  );
}

/**
 * Example 2: Page with title and subtitle
 */
export function PageWithSubtitleExample() {
  return (
    <PageLayout
      title="Analytics"
      subtitle="Track your performance metrics and insights"
    >
      <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
        <Card>Metric 1</Card>
        <Card>Metric 2</Card>
        <Card>Metric 3</Card>
      </div>
    </PageLayout>
  );
}

/**
 * Example 3: Page with actions
 */
export function PageWithActionsExample() {
  return (
    <PageLayout
      title="Content Library"
      subtitle="Manage your content and media"
      actions={
        <>
          <Button variant="primary" style={{
              padding: 'var(--space-2) var(--space-4)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
            }}
          >
            Filter
          </Button>
          <button
            style={{
              padding: 'var(--space-2) var(--space-4)',
              borderRadius: 'var(--radius-lg)',
              border: 'none',
              background: 'var(--accent-primary)',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            Create New
          </button>
        </>
      }
    >
      <Card>Content grid goes here</Card>
    </PageLayout>
  );
}

/**
 * Example 4: Page with Container for max-width constraint
 */
export function PageWithContainerExample() {
  return (
    <Container maxWidth="lg" padding="md">
      <PageLayout
        title="Settings"
        subtitle="Manage your account preferences"
      >
        <Card>
          <form>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <label style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                  Email
                </label>
                <input
                  type="email"
                  style={{
                    width: '100%',
                    padding: 'var(--space-2) var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
              <button
                type="submit"
                style={{
                  padding: 'var(--space-2) var(--space-4)',
                  borderRadius: 'var(--radius-lg)',
                  border: 'none',
                  background: 'var(--accent-primary)',
                  color: 'white',
                  cursor: 'pointer',
                }}
              >
                Save Changes
              </button>
            </div>
          </form>
        </Card>
      </PageLayout>
    </Container>
  );
}

/**
 * Example 5: Full-width page without container
 */
export function FullWidthPageExample() {
  return (
    <PageLayout
      title="Reports"
      subtitle="View detailed analytics and reports"
      actions={
        <button
          style={{
            padding: 'var(--space-2) var(--space-4)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
          }}
        >
          Export
        </button>
      }
    >
      <div style={{ width: '100%', height: '400px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-xl)' }}>
        <p style={{ padding: 'var(--space-4)', color: 'var(--text-primary)' }}>
          Full-width chart or table goes here
        </p>
      </div>
    </PageLayout>
  );
}

/**
 * Example 6: Page with multiple sections
 */
export function MultiSectionPageExample() {
  return (
    <PageLayout
      title="Integrations"
      subtitle="Connect your favorite tools and services"
      actions={
        <Button variant="primary" style={{
            padding: 'var(--space-2) var(--space-4)',
            borderRadius: 'var(--radius-lg)',
            border: 'none',
            background: 'var(--accent-primary)',
            color: 'white',
            cursor: 'pointer',
          }}
        >
          Add Integration
        </Button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <section>
          <h2 style={{ 
            fontSize: 'var(--text-xl)', 
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-4)',
          }}>
            Active Integrations
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
            <Card>Integration 1</Card>
            <Card>Integration 2</Card>
            <Card>Integration 3</Card>
          </div>
        </section>
        
        <section>
          <h2 style={{ 
            fontSize: 'var(--text-xl)', 
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-4)',
          }}>
            Available Integrations
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
            <Card>Integration 4</Card>
            <Card>Integration 5</Card>
            <Card>Integration 6</Card>
          </div>
        </section>
      </div>
    </PageLayout>
  );
}

/**
 * Example 7: Minimal page (no header)
 */
export function MinimalPageExample() {
  return (
    <PageLayout>
      <Card>
        <p>Content without any header elements</p>
      </Card>
    </PageLayout>
  );
}

/**
 * Example 8: Page with custom styling
 */
export function CustomStyledPageExample() {
  return (
    <PageLayout
      title="Custom Page"
      subtitle="With custom styling applied"
      className="custom-page"
      headerClassName="custom-header"
      contentClassName="custom-content"
    >
      <Card variant="glass">
        <p>Custom styled page with glass effect card</p>
      </Card>
    </PageLayout>
  );
}

/**
 * Example 9: Responsive page with mobile considerations
 */
export function ResponsivePageExample() {
  return (
    <PageLayout
      title="Mobile Friendly"
      subtitle="This layout adapts to different screen sizes"
      actions={
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <Button
            variant="primary"
            style={{
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-sm)',
              cursor: 'pointer',
            }}
          >
            Action 1
          </Button>
          <Button
            variant="primary"
            style={{
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-lg)',
              border: 'none',
              background: 'var(--accent-primary)',
              color: 'white',
              fontSize: 'var(--text-sm)',
              cursor: 'pointer',
            }}
          >
            Action 2
          </Button>
        </div>
      }
    >
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: 'var(--space-4)',
      }}>
        <Card>Responsive Card 1</Card>
        <Card>Responsive Card 2</Card>
        <Card>Responsive Card 3</Card>
      </div>
    </PageLayout>
  );
}
