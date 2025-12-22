/**
 * PageLayout Component Examples
 * 
 * Demonstrates various usage patterns for the PageLayout component
 * with different combinations of props.
 */

import React from 'react';
import { PageLayout } from './PageLayout';

/**
 * Example 1: Basic page with title only
 */
export function BasicPageExample() {
  return (
    <PageLayout title="Dashboard">
      <div>Page content goes here</div>
    </PageLayout>
  );
}

/**
 * Example 2: Page with subtitle (section label)
 */
export function PageWithSubtitleExample() {
  return (
    <PageLayout
      title="Centralize your message automations"
      subtitle="AUTOMATIONS"
    >
      <div>Smart Messages content</div>
    </PageLayout>
  );
}

/**
 * Example 3: Page with actions
 */
export function PageWithActionsExample() {
  return (
    <PageLayout
      title="Fans"
      actions={
        <>
          <button className="secondary-button">Export</button>
          <button className="primary-button">Add Fan</button>
        </>
      }
    >
      <div>Fans table content</div>
    </PageLayout>
  );
}

/**
 * Example 4: Page with filters
 */
export function PageWithFiltersExample() {
  return (
    <PageLayout
      title="PPV Content"
      filters={
        <div style={{ display: 'flex', gap: '8px' }}>
          <button>All Status</button>
          <button>Active</button>
          <button>Draft</button>
        </div>
      }
    >
      <div>PPV campaigns grid</div>
    </PageLayout>
  );
}

/**
 * Example 5: Complete page with all props
 */
export function CompletePageExample() {
  return (
    <PageLayout
      title="Fans"
      subtitle="AUDIENCE"
      actions={
        <>
          <button className="secondary-button">Export</button>
          <button className="primary-button">Add Fan</button>
        </>
      }
      filters={
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Filter: VIP
          </span>
          <button>×</button>
        </div>
      }
    >
      <div>
        <div style={{ marginBottom: '24px' }}>
          {/* Segment cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            <div>ALL FANS</div>
            <div>VIP</div>
            <div>ACTIVE</div>
            <div>AT-RISK</div>
          </div>
        </div>
        <div>
          {/* Fans table */}
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Tier</th>
                <th>Churn Risk</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Fan 1</td>
                <td>VIP</td>
                <td>Low</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </PageLayout>
  );
}

/**
 * Example 6: Empty state page
 */
export function EmptyStatePageExample() {
  return (
    <PageLayout
      title="Smart Messages"
      subtitle="AUTOMATIONS"
      actions={<button className="primary-button">New Smart Rule</button>}
    >
      <div style={{ 
        textAlign: 'center', 
        padding: '48px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px'
      }}>
        <div style={{ fontSize: '48px', color: 'var(--text-tertiary)' }}>📋</div>
        <h2 style={{ fontSize: '18px', fontWeight: 600 }}>No smart rules yet</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          Create your first automation to streamline your messaging workflow
        </p>
        <ul style={{ 
          textAlign: 'left', 
          fontSize: '13px', 
          color: 'var(--text-secondary)',
          listStyle: 'disc',
          paddingLeft: '20px'
        }}>
          <li>Auto-respond to new subscribers</li>
          <li>Re-engage inactive fans</li>
          <li>Prioritize VIP conversations</li>
        </ul>
        <button className="primary-button">New Smart Rule</button>
        <a href="#" style={{ fontSize: '13px', color: 'var(--accent-primary)' }}>
          View examples
        </a>
      </div>
    </PageLayout>
  );
}
