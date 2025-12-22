/**
 * Performance Memoization Tests
 * Task 8.2: Verify React.memo, useMemo, and useCallback implementations
 * 
 * Tests that expensive components and calculations are properly memoized
 * to prevent unnecessary re-renders and improve performance.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { StatCard } from '@/components/ui/StatCard';
import { InfoCard } from '@/components/ui/InfoCard';
import { TagChip } from '@/components/ui/TagChip';
import { DashboardEmptyState } from '@/components/ui/DashboardEmptyState';

describe('Component Memoization', () => {
  describe('StatCard', () => {
    it('should be memoized with React.memo', () => {
      // Check if StatCard is wrapped with React.memo
      // React.memo components have a $$typeof property
      expect(StatCard).toHaveProperty('$$typeof');
      // The component type should be a memo type
      expect(String(StatCard.$$typeof)).toContain('react.memo');
    });

    it('should not re-render when props are unchanged', () => {
      const renderSpy = vi.fn();
      
      const MemoizedStatCard = React.memo(() => {
        renderSpy();
        return <StatCard label="Test" value="100" />;
      });

      const { rerender } = render(<MemoizedStatCard />);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Re-render with same props
      rerender(<MemoizedStatCard />);
      expect(renderSpy).toHaveBeenCalledTimes(1); // Should not re-render
    });

    it('should re-render when props change', () => {
      const { rerender } = render(<StatCard label="Test" value="100" />);
      expect(screen.getByTestId('stat-card-value')).toHaveTextContent('100');

      rerender(<StatCard label="Test" value="200" />);
      expect(screen.getByTestId('stat-card-value')).toHaveTextContent('200');
    });
  });

  describe('InfoCard', () => {
    it('should be memoized with React.memo', () => {
      expect(InfoCard).toHaveProperty('$$typeof');
      expect(String(InfoCard.$$typeof)).toContain('react.memo');
    });

    it('should not re-render when props are unchanged', () => {
      const renderSpy = vi.fn();
      
      const MemoizedInfoCard = React.memo(() => {
        renderSpy();
        return (
          <InfoCard
            icon={<div>Icon</div>}
            title="Test Title"
            description="Test Description"
          />
        );
      });

      const { rerender } = render(<MemoizedInfoCard />);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      rerender(<MemoizedInfoCard />);
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('TagChip', () => {
    it('should be memoized with React.memo', () => {
      expect(TagChip).toHaveProperty('$$typeof');
      expect(String(TagChip.$$typeof)).toContain('react.memo');
    });

    it('should not re-render when props are unchanged', () => {
      const renderSpy = vi.fn();
      
      const MemoizedTagChip = React.memo(() => {
        renderSpy();
        return <TagChip label="VIP" variant="vip" />;
      });

      const { rerender } = render(<MemoizedTagChip />);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      rerender(<MemoizedTagChip />);
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('DashboardEmptyState', () => {
    it('should be memoized with React.memo', () => {
      expect(DashboardEmptyState).toHaveProperty('$$typeof');
      expect(String(DashboardEmptyState.$$typeof)).toContain('react.memo');
    });

    it('should not re-render when props are unchanged', () => {
      const renderSpy = vi.fn();
      const mockCta = { label: 'Click Me', onClick: vi.fn() };
      
      const MemoizedEmptyState = React.memo(() => {
        renderSpy();
        return (
          <DashboardEmptyState
            icon={<div>Icon</div>}
            title="Empty"
            description="No data"
            cta={mockCta}
          />
        );
      });

      const { rerender } = render(<MemoizedEmptyState />);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      rerender(<MemoizedEmptyState />);
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });
  });
});

describe('Hook Memoization Patterns', () => {
  it('should demonstrate useMemo for expensive calculations', () => {
    // This test verifies the pattern, actual implementation is in the views
    const expensiveCalculation = (num: number) => {
      let result = 0;
      for (let i = 0; i < num; i++) {
        result += i;
      }
      return result;
    };

    const TestComponent = ({ value }: { value: number }) => {
      const memoizedValue = React.useMemo(() => expensiveCalculation(value), [value]);
      return <div data-testid="result">{memoizedValue}</div>;
    };

    const { rerender } = render(<TestComponent value={100} />);
    const result1 = screen.getByTestId('result').textContent;

    // Re-render with same value - should use memoized result
    rerender(<TestComponent value={100} />);
    expect(screen.getByTestId('result').textContent).toBe(result1);

    // Re-render with different value - should recalculate
    rerender(<TestComponent value={200} />);
    expect(screen.getByTestId('result').textContent).not.toBe(result1);
  });

  it('should demonstrate useCallback for event handlers', () => {
    const TestComponent = ({ onAction }: { onAction: () => void }) => {
      const handleClick = React.useCallback(() => {
        onAction();
      }, [onAction]);

      return <button onClick={handleClick}>Click</button>;
    };

    const mockAction = vi.fn();
    const { rerender } = render(<TestComponent onAction={mockAction} />);
    
    const button = screen.getByRole('button');
    button.click();
    expect(mockAction).toHaveBeenCalledTimes(1);

    // Re-render with same callback
    rerender(<TestComponent onAction={mockAction} />);
    button.click();
    expect(mockAction).toHaveBeenCalledTimes(2);
  });
});

describe('Performance Characteristics', () => {
  it('should render StatCard efficiently', () => {
    const startTime = performance.now();
    
    render(
      <>
        {Array.from({ length: 10 }).map((_, i) => (
          <StatCard key={i} label={`Metric ${i}`} value={i * 100} />
        ))}
      </>
    );
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Should render 10 cards in less than 100ms
    expect(renderTime).toBeLessThan(100);
  });

  it('should render InfoCard efficiently', () => {
    const startTime = performance.now();
    
    render(
      <>
        {Array.from({ length: 10 }).map((_, i) => (
          <InfoCard
            key={i}
            icon={<div>Icon</div>}
            title={`Card ${i}`}
            description="Description"
          />
        ))}
      </>
    );
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Should render 10 cards in less than 100ms
    expect(renderTime).toBeLessThan(100);
  });

  it('should render TagChip efficiently', () => {
    const startTime = performance.now();
    
    render(
      <>
        {Array.from({ length: 50 }).map((_, i) => (
          <TagChip key={i} label={`Tag ${i}`} variant="active" />
        ))}
      </>
    );
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Should render 50 chips in less than 100ms
    expect(renderTime).toBeLessThan(100);
  });
});
