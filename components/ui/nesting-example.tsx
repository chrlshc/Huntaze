/**
 * Nesting Example Component
 * 
 * Demonstrates progressive background lightening for nested components
 * using the design system's nesting levels.
 * 
 * Part of Task 40: Implement progressive lightening for nested components
 * Validates: Requirement 9.5
 */

import React from 'react';
import { Container } from './container';
import { Card } from './card';

/**
 * Example showing proper nesting hierarchy with Container components
 */
export function ContainerNestingExample() {
  return (
    <Container nestingLevel={0} maxWidth="xl" padding="lg">
      <h1 className="text-[var(--text-primary)] text-[var(--text-3xl)] mb-[var(--space-6)]">
        Dashboard
      </h1>
      
      <Container nestingLevel={1} padding="md" className="mb-[var(--space-6)]">
        <h2 className="text-[var(--text-primary)] text-[var(--text-2xl)] mb-[var(--space-4)]">
          Analytics Overview
        </h2>
        <p className="text-[var(--text-primary)] mb-[var(--space-4)]">
          View your key metrics and performance indicators
        </p>
        
        <Container nestingLevel={2} padding="sm">
          <h3 className="text-[var(--text-primary)] text-[var(--text-xl)] mb-[var(--space-3)]">
            Revenue Breakdown
          </h3>
          <p className="text-[var(--text-primary)]">
            Detailed revenue analysis by product category
          </p>
        </Container>
      </Container>
    </Container>
  );
}

/**
 * Example showing proper nesting hierarchy with Card components
 */
export function CardNestingExample() {
  return (
    <div className="nesting-level-0 p-[var(--space-8)]">
      <h1 className="text-[var(--text-primary)] text-[var(--text-3xl)] mb-[var(--space-6)]">
        Settings
      </h1>
      
      <Card nestingLevel={1} className="mb-[var(--space-6)]">
        <h2 className="text-[var(--text-primary)] text-[var(--text-2xl)] mb-[var(--space-4)]">
          Profile Settings
        </h2>
        
        <Card nestingLevel={2} className="mb-[var(--space-4)]">
          <h3 className="text-[var(--text-primary)] text-[var(--text-xl)] mb-[var(--space-3)]">
            Personal Information
          </h3>
          <p className="text-[var(--text-primary)] mb-[var(--space-3)]">
            Update your personal details
          </p>
          
          <Card nestingLevel={3}>
            <p className="text-[var(--text-primary)] text-[var(--text-sm)]">
              Note: Changes will be saved automatically
            </p>
          </Card>
        </Card>
        
        <Card nestingLevel={2}>
          <h3 className="text-[var(--text-primary)] text-[var(--text-xl)] mb-[var(--space-3)]">
            Security Settings
          </h3>
          <p className="text-[var(--text-primary)]">
            Manage your password and authentication methods
          </p>
        </Card>
      </Card>
    </div>
  );
}

/**
 * Example showing mixed nesting with both Container and Card
 */
export function MixedNestingExample() {
  return (
    <Container nestingLevel={0} maxWidth="xl" padding="lg">
      <h1 className="text-[var(--text-primary)] text-[var(--text-3xl)] mb-[var(--space-6)]">
        Project Dashboard
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--space-6)]">
        <Card nestingLevel={1}>
          <h2 className="text-[var(--text-primary)] text-[var(--text-xl)] mb-[var(--space-4)]">
            Active Projects
          </h2>
          
          <Card nestingLevel={2} className="mb-[var(--space-3)]">
            <h3 className="text-[var(--text-primary)] text-[var(--text-lg)] mb-[var(--space-2)]">
              Project Alpha
            </h3>
            <p className="text-[var(--text-primary)] text-[var(--text-sm)]">
              Status: In Progress
            </p>
          </Card>
          
          <Card nestingLevel={2}>
            <h3 className="text-[var(--text-primary)] text-[var(--text-lg)] mb-[var(--space-2)]">
              Project Beta
            </h3>
            <p className="text-[var(--text-primary)] text-[var(--text-sm)]">
              Status: Planning
            </p>
          </Card>
        </Card>
        
        <Card nestingLevel={1}>
          <h2 className="text-[var(--text-primary)] text-[var(--text-xl)] mb-[var(--space-4)]">
            Team Members
          </h2>
          
          <Card nestingLevel={2}>
            <p className="text-[var(--text-primary)]">
              5 active team members
            </p>
          </Card>
        </Card>
      </div>
    </Container>
  );
}

/**
 * Example showing what NOT to do - skipping nesting levels
 */
export function BadNestingExample() {
  return (
    <div className="nesting-level-0 p-[var(--space-8)]">
      <h1 className="text-[var(--text-primary)] text-[var(--text-3xl)] mb-[var(--space-6)]">
        ❌ Bad Example - Don't Do This
      </h1>
      
      {/* BAD: Skipping from level 0 to level 3 */}
      <Card nestingLevel={3}>
        <h2 className="text-[var(--text-primary)] text-[var(--text-xl)]">
          This card skips levels 1 and 2
        </h2>
        <p className="text-[var(--text-primary)]">
          This creates inconsistent visual hierarchy
        </p>
      </Card>
    </div>
  );
}

/**
 * Example showing correct progressive nesting
 */
export function GoodNestingExample() {
  return (
    <div className="nesting-level-0 p-[var(--space-8)]">
      <h1 className="text-[var(--text-primary)] text-[var(--text-3xl)] mb-[var(--space-6)]">
        ✅ Good Example - Follow This Pattern
      </h1>
      
      {/* GOOD: Progressive nesting from 1 → 2 → 3 */}
      <Card nestingLevel={1}>
        <h2 className="text-[var(--text-primary)] text-[var(--text-xl)] mb-[var(--space-4)]">
          Level 1: Main Card
        </h2>
        
        <Card nestingLevel={2} className="mb-[var(--space-4)]">
          <h3 className="text-[var(--text-primary)] text-[var(--text-lg)] mb-[var(--space-3)]">
            Level 2: Nested Card
          </h3>
          
          <Card nestingLevel={3}>
            <p className="text-[var(--text-primary)]">
              Level 3: Deeply Nested Content
            </p>
          </Card>
        </Card>
      </Card>
    </div>
  );
}

export default {
  ContainerNestingExample,
  CardNestingExample,
  MixedNestingExample,
  BadNestingExample,
  GoodNestingExample,
};
