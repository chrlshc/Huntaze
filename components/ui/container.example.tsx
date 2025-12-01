/**
 * Container Component - Usage Examples
 * 
 * Demonstrates various use cases for the Container component
 * with design tokens for responsive layouts.
 */

import React from 'react';
import { Container } from './container';
import { Button } from "@/components/ui/button";
import { Card } from '@/components/ui/card';

/**
 * Example 1: Basic Container with Default Settings
 * Uses lg max-width (1024px) and md padding (24px)
 */
export function BasicContainerExample() {
  return (
    <Container>
      <h1>Welcome to Huntaze</h1>
      <p>This is a basic container with default settings.</p>
    </Container>
  );
}

/**
 * Example 2: Small Container for Forms
 * Uses sm max-width (640px) with large padding
 */
export function FormContainerExample() {
  return (
    <Container maxWidth="sm" padding="lg" as="section">
      <h2>Sign Up</h2>
      <form>
        <div>
          <label htmlFor="email">Email</label>
          <input type="email" id="email" />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input type="password" id="password" />
        </div>
        <Button variant="primary" type="submit">Submit</Button>
      </form>
    </Container>
  );
}

/**
 * Example 3: Full-Width Container
 * Uses full width with no padding for edge-to-edge content
 */
export function FullWidthContainerExample() {
  return (
    <Container maxWidth="full" padding="none">
      <div style={{ background: 'var(--bg-glass)', height: '400px' }}>
        <p style={{ padding: 'var(--space-6)' }}>
          Full-width hero section
        </p>
      </div>
    </Container>
  );
}

/**
 * Example 4: Extra Large Container for Dashboard
 * Uses xl max-width (1280px) for wide dashboard layouts
 */
export function DashboardContainerExample() {
  return (
    <Container maxWidth="xl" padding="md" as="main">
      <header>
        <h1>Dashboard</h1>
        <p>Overview of your account</p>
      </header>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: 'var(--space-6)' 
      }}>
        <div>
          <h3>Total Users</h3>
          <p style={{ fontSize: 'var(--text-3xl)' }}>1,234</p>
        </div>
        <div>
          <h3>Revenue</h3>
          <p style={{ fontSize: 'var(--text-3xl)' }}>$45,678</p>
        </div>
        <div>
          <h3>Growth</h3>
          <p style={{ fontSize: 'var(--text-3xl)' }}>+12%</p>
        </div>
      </div>
    </Container>
  );
}

/**
 * Example 5: Nested Containers
 * Demonstrates using containers within containers
 */
export function NestedContainerExample() {
  return (
    <Container maxWidth="full" padding="none">
      <div style={{ background: 'var(--bg-secondary)', padding: 'var(--space-12)' }}>
        <Container maxWidth="lg" padding="md">
          <h1>Nested Content</h1>
          <p>This container is nested within a full-width background.</p>
          
          <div style={{ maxWidth: 'var(--container-md)', padding: 'var(--space-4)' }}>
            <div>
              <p>Even more nested content with smaller max-width</p>
            </div>
          </div>
        </Container>
      </div>
    </Container>
  );
}

/**
 * Example 6: Non-Centered Container
 * Uses centered={false} for left-aligned content
 */
export function NonCenteredContainerExample() {
  return (
    <Container maxWidth="md" padding="md" centered={false}>
      <h2>Left-Aligned Content</h2>
      <p>This container is not centered horizontally.</p>
    </Container>
  );
}

/**
 * Example 7: Article Layout
 * Uses semantic HTML with 'article' element
 */
export function ArticleContainerExample() {
  return (
    <Container maxWidth="md" padding="lg" as="article">
      <header>
        <h1>Understanding Design Tokens</h1>
        <p style={{ color: 'var(--text-primary)' }}>
          Published on November 27, 2025
        </p>
      </header>
      
      <div style={{ 
        marginTop: 'var(--space-8)',
        lineHeight: 'var(--leading-relaxed)' 
      }}>
        <p>
          Design tokens are the foundation of a consistent design system...
        </p>
      </div>
    </Container>
  );
}

/**
 * Example 8: Responsive Container with Custom Styling
 * Combines Container with custom classes
 */
export function CustomStyledContainerExample() {
  return (
    <Container 
      maxWidth="lg" 
      padding="md"
      className="glass-card"
      as="section"
    >
      <h2>Custom Styled Container</h2>
      <p>This container has glass effect applied via className.</p>
    </Container>
  );
}

/**
 * All Examples Component
 * Renders all examples for testing and documentation
 */
export function AllContainerExamples() {
  return (
    <div style={{ 
      background: 'var(--bg-primary)',
      minHeight: '100vh',
      padding: 'var(--space-8)'
    }}>
      <h1 style={{ 
        textAlign: 'center', 
        marginBottom: 'var(--space-12)',
        color: 'var(--text-primary)'
      }}>
        Container Component Examples
      </h1>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)' }}>
        <BasicContainerExample />
        <FormContainerExample />
        <FullWidthContainerExample />
        <DashboardContainerExample />
        <NestedContainerExample />
        <NonCenteredContainerExample />
        <ArticleContainerExample />
        <CustomStyledContainerExample />
      </div>
    </div>
  );
}

export default AllContainerExamples;
