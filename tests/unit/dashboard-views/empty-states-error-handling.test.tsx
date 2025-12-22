import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  SmartMessagesEmptyState,
  FansEmptyState,
  PPVContentEmptyState,
  GenericDataEmptyState,
} from '@/components/dashboard-views/EmptyStateExamples';

/**
 * Empty States Tests
 * 
 * Tests for empty state components used across dashboard views.
 */

describe('SmartMessagesEmptyState', () => {
  it('renders with correct title and description', () => {
    const onCreateRule = vi.fn();
    render(<SmartMessagesEmptyState onCreateRule={onCreateRule} />);

    expect(screen.getByText('No smart rules yet')).toBeInTheDocument();
    expect(
      screen.getByText('Create automated workflows to save time and engage fans more effectively')
    ).toBeInTheDocument();
  });

  it('displays benefits list', () => {
    const onCreateRule = vi.fn();
    render(<SmartMessagesEmptyState onCreateRule={onCreateRule} />);

    expect(screen.getByText('Auto-respond to new subscribers')).toBeInTheDocument();
    expect(screen.getByText('Re-engage inactive fans')).toBeInTheDocument();
    expect(screen.getByText('Prioritize VIP conversations')).toBeInTheDocument();
  });

  it('renders CTA button with correct label', () => {
    const onCreateRule = vi.fn();
    render(<SmartMessagesEmptyState onCreateRule={onCreateRule} />);

    const button = screen.getByRole('button', { name: /new smart rule/i });
    expect(button).toBeInTheDocument();
  });

  it('calls onCreateRule when CTA is clicked', () => {
    const onCreateRule = vi.fn();
    render(<SmartMessagesEmptyState onCreateRule={onCreateRule} />);

    const button = screen.getByRole('button', { name: /new smart rule/i });
    fireEvent.click(button);

    expect(onCreateRule).toHaveBeenCalledTimes(1);
  });

  it('has proper ARIA attributes', () => {
    const onCreateRule = vi.fn();
    render(<SmartMessagesEmptyState onCreateRule={onCreateRule} />);

    const emptyState = screen.getByTestId('dashboard-empty-state');
    expect(emptyState).toHaveAttribute('role', 'region');
  });
});

describe('FansEmptyState', () => {
  it('renders with correct title and description', () => {
    const onConnectAccount = vi.fn();
    render(<FansEmptyState onConnectAccount={onConnectAccount} />);

    expect(screen.getByText('No fans yet')).toBeInTheDocument();
    expect(
      screen.getByText('Connect your OnlyFans account to start managing your fan relationships')
    ).toBeInTheDocument();
  });

  it('displays benefits list', () => {
    const onConnectAccount = vi.fn();
    render(<FansEmptyState onConnectAccount={onConnectAccount} />);

    expect(screen.getByText('Track fan engagement and lifetime value')).toBeInTheDocument();
    expect(screen.getByText('Identify VIP fans and at-risk subscribers')).toBeInTheDocument();
    expect(screen.getByText('Segment fans for targeted messaging')).toBeInTheDocument();
  });

  it('renders CTA button with correct label', () => {
    const onConnectAccount = vi.fn();
    render(<FansEmptyState onConnectAccount={onConnectAccount} />);

    const button = screen.getByRole('button', { name: /connect onlyfans/i });
    expect(button).toBeInTheDocument();
  });

  it('calls onConnectAccount when CTA is clicked', () => {
    const onConnectAccount = vi.fn();
    render(<FansEmptyState onConnectAccount={onConnectAccount} />);

    const button = screen.getByRole('button', { name: /connect onlyfans/i });
    fireEvent.click(button);

    expect(onConnectAccount).toHaveBeenCalledTimes(1);
  });
});

describe('PPVContentEmptyState', () => {
  it('renders with correct title and description', () => {
    const onCreateContent = vi.fn();
    render(<PPVContentEmptyState onCreateContent={onCreateContent} />);

    expect(screen.getByText('No PPV content yet')).toBeInTheDocument();
    expect(
      screen.getByText('Create pay-per-view content to monetize your exclusive media')
    ).toBeInTheDocument();
  });

  it('displays benefits list', () => {
    const onCreateContent = vi.fn();
    render(<PPVContentEmptyState onCreateContent={onCreateContent} />);

    expect(screen.getByText('Set custom prices for premium content')).toBeInTheDocument();
    expect(screen.getByText('Track opens and purchase rates')).toBeInTheDocument();
    expect(screen.getByText('Send targeted PPV messages to fans')).toBeInTheDocument();
  });

  it('renders CTA button with correct label', () => {
    const onCreateContent = vi.fn();
    render(<PPVContentEmptyState onCreateContent={onCreateContent} />);

    const button = screen.getByRole('button', { name: /create ppv content/i });
    expect(button).toBeInTheDocument();
  });

  it('calls onCreateContent when CTA is clicked', () => {
    const onCreateContent = vi.fn();
    render(<PPVContentEmptyState onCreateContent={onCreateContent} />);

    const button = screen.getByRole('button', { name: /create ppv content/i });
    fireEvent.click(button);

    expect(onCreateContent).toHaveBeenCalledTimes(1);
  });
});

describe('GenericDataEmptyState', () => {
  it('renders with default title and description', () => {
    render(<GenericDataEmptyState />);

    expect(screen.getByText('No data found')).toBeInTheDocument();
    expect(
      screen.getByText('Try adjusting your filters or search criteria')
    ).toBeInTheDocument();
  });

  it('renders with custom title and description', () => {
    render(
      <GenericDataEmptyState
        title="Custom title"
        description="Custom description"
      />
    );

    expect(screen.getByText('Custom title')).toBeInTheDocument();
    expect(screen.getByText('Custom description')).toBeInTheDocument();
  });

  it('renders "Clear Filters" button when onClearFilters is provided', () => {
    const onClearFilters = vi.fn();
    render(<GenericDataEmptyState onClearFilters={onClearFilters} />);

    const button = screen.getByRole('button', { name: /clear filters/i });
    expect(button).toBeInTheDocument();
  });

  it('renders "Refresh" button when onClearFilters is not provided', () => {
    render(<GenericDataEmptyState />);

    const button = screen.getByRole('button', { name: /refresh/i });
    expect(button).toBeInTheDocument();
  });

  it('calls onClearFilters when button is clicked', () => {
    const onClearFilters = vi.fn();
    render(<GenericDataEmptyState onClearFilters={onClearFilters} />);

    const button = screen.getByRole('button', { name: /clear filters/i });
    fireEvent.click(button);

    expect(onClearFilters).toHaveBeenCalledTimes(1);
  });
});

describe('Empty State Consistency', () => {
  it('all empty states have clear CTAs', () => {
    const { rerender } = render(
      <SmartMessagesEmptyState onCreateRule={vi.fn()} />
    );
    expect(screen.getByRole('button')).toBeInTheDocument();

    rerender(<FansEmptyState onConnectAccount={vi.fn()} />);
    expect(screen.getByRole('button')).toBeInTheDocument();

    rerender(<PPVContentEmptyState onCreateContent={vi.fn()} />);
    expect(screen.getByRole('button')).toBeInTheDocument();

    rerender(<GenericDataEmptyState />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('all empty states have icons', () => {
    const { rerender } = render(
      <SmartMessagesEmptyState onCreateRule={vi.fn()} />
    );
    expect(screen.getByTestId('empty-state-icon')).toBeInTheDocument();

    rerender(<FansEmptyState onConnectAccount={vi.fn()} />);
    expect(screen.getByTestId('empty-state-icon')).toBeInTheDocument();

    rerender(<PPVContentEmptyState onCreateContent={vi.fn()} />);
    expect(screen.getByTestId('empty-state-icon')).toBeInTheDocument();

    rerender(<GenericDataEmptyState />);
    expect(screen.getByTestId('empty-state-icon')).toBeInTheDocument();
  });

  it('all empty states have proper ARIA attributes', () => {
    const { rerender } = render(
      <SmartMessagesEmptyState onCreateRule={vi.fn()} />
    );
    let emptyState = screen.getByTestId('dashboard-empty-state');
    expect(emptyState).toHaveAttribute('role', 'region');

    rerender(<FansEmptyState onConnectAccount={vi.fn()} />);
    emptyState = screen.getByTestId('dashboard-empty-state');
    expect(emptyState).toHaveAttribute('role', 'region');

    rerender(<PPVContentEmptyState onCreateContent={vi.fn()} />);
    emptyState = screen.getByTestId('dashboard-empty-state');
    expect(emptyState).toHaveAttribute('role', 'region');
  });
});
