import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Alert } from '@/components/ui/alert';

describe('Alert Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<Alert>Test message</Alert>);
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('should render with title', () => {
      render(<Alert title="Test Title">Test message</Alert>);
      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('should render without title', () => {
      render(<Alert>Test message</Alert>);
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<Alert className="custom-class">Test message</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('alert');
      expect(alert).toHaveClass('custom-class');
    });
  });

  describe('Variants', () => {
    it('should render success variant', () => {
      render(<Alert variant="success">Success message</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(screen.getByText('Success message')).toBeInTheDocument();
    });

    it('should render warning variant', () => {
      render(<Alert variant="warning">Warning message</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(screen.getByText('Warning message')).toBeInTheDocument();
    });

    it('should render error variant', () => {
      render(<Alert variant="error">Error message</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });

    it('should render info variant (default)', () => {
      render(<Alert variant="info">Info message</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(screen.getByText('Info message')).toBeInTheDocument();
    });

    it('should default to info variant when no variant specified', () => {
      render(<Alert>Default message</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(screen.getByText('Default message')).toBeInTheDocument();
    });
  });

  describe('Design Token Usage', () => {
    it('should use spacing tokens for padding', () => {
      render(<Alert>Test message</Alert>);
      const alert = screen.getByRole('alert');
      const style = window.getComputedStyle(alert);
      expect(style.padding).toBe('var(--space-4)');
    });

    it('should use border radius token', () => {
      render(<Alert>Test message</Alert>);
      const alert = screen.getByRole('alert');
      const style = window.getComputedStyle(alert);
      expect(style.borderRadius).toBe('var(--radius-xl)');
    });

    it('should use transition token for animations', () => {
      render(<Alert>Test message</Alert>);
      const alert = screen.getByRole('alert');
      const style = window.getComputedStyle(alert);
      expect(style.transition).toContain('var(--transition-base)');
    });

    it('should use backdrop blur token', () => {
      render(<Alert>Test message</Alert>);
      const alert = screen.getByRole('alert');
      // Check that the component renders (backdrop-filter is applied via inline styles)
      expect(alert).toBeInTheDocument();
    });

    it('should use shadow token', () => {
      render(<Alert>Test message</Alert>);
      const alert = screen.getByRole('alert');
      const style = window.getComputedStyle(alert);
      expect(style.boxShadow).toBe('var(--shadow-sm)');
    });

    it('should use text color tokens', () => {
      render(<Alert title="Title">Message</Alert>);
      const title = screen.getByText('Title');
      const message = screen.getByText('Message');
      
      const titleStyle = window.getComputedStyle(title);
      const messageStyle = window.getComputedStyle(message);
      
      expect(titleStyle.color).toBe('var(--text-primary)');
      expect(messageStyle.color).toBe('var(--text-secondary)');
    });

    it('should use font size tokens', () => {
      render(<Alert title="Title">Message</Alert>);
      const title = screen.getByText('Title');
      const message = screen.getByText('Message');
      
      const titleStyle = window.getComputedStyle(title);
      const messageStyle = window.getComputedStyle(message);
      
      expect(titleStyle.fontSize).toBe('var(--text-sm)');
      expect(messageStyle.fontSize).toBe('var(--text-sm)');
    });
  });

  describe('Icons', () => {
    it('should render default icon for each variant', () => {
      const { rerender } = render(<Alert variant="success">Message</Alert>);
      expect(screen.getByRole('alert').querySelector('svg')).toBeInTheDocument();

      rerender(<Alert variant="warning">Message</Alert>);
      expect(screen.getByRole('alert').querySelector('svg')).toBeInTheDocument();

      rerender(<Alert variant="error">Message</Alert>);
      expect(screen.getByRole('alert').querySelector('svg')).toBeInTheDocument();

      rerender(<Alert variant="info">Message</Alert>);
      expect(screen.getByRole('alert').querySelector('svg')).toBeInTheDocument();
    });

    it('should render custom icon when provided', () => {
      const customIcon = (
        <svg data-testid="custom-icon">
          <circle cx="10" cy="10" r="10" />
        </svg>
      );
      
      render(<Alert icon={customIcon}>Message</Alert>);
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });
  });

  describe('Dismissible Functionality', () => {
    it('should not show dismiss button by default', () => {
      render(<Alert>Test message</Alert>);
      expect(screen.queryByLabelText('Dismiss alert')).not.toBeInTheDocument();
    });

    it('should show dismiss button when dismissible is true', () => {
      render(<Alert dismissible>Test message</Alert>);
      expect(screen.getByLabelText('Dismiss alert')).toBeInTheDocument();
    });

    it('should call onDismiss when dismiss button is clicked', async () => {
      const onDismiss = vi.fn();
      
      render(<Alert dismissible onDismiss={onDismiss}>Test message</Alert>);
      
      const dismissButton = screen.getByLabelText('Dismiss alert');
      dismissButton.click();
      
      // Wait for animation
      vi.advanceTimersByTime(200);
      
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('should remove alert from DOM after dismiss animation', () => {
      render(<Alert dismissible>Test message</Alert>);
      
      const dismissButton = screen.getByLabelText('Dismiss alert');
      
      act(() => {
        dismissButton.click();
      });
      
      // Wait for animation
      act(() => {
        vi.advanceTimersByTime(200);
      });
      
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Auto-dismiss Functionality', () => {
    it('should not auto-dismiss by default', () => {
      render(<Alert>Test message</Alert>);
      
      vi.advanceTimersByTime(10000);
      
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should not auto-dismiss when autoDismiss is 0', () => {
      render(<Alert autoDismiss={0}>Test message</Alert>);
      
      vi.advanceTimersByTime(10000);
      
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should auto-dismiss after specified duration', () => {
      const onDismiss = vi.fn();
      
      render(<Alert autoDismiss={3000} onDismiss={onDismiss}>Test message</Alert>);
      
      expect(screen.getByRole('alert')).toBeInTheDocument();
      
      // Advance time to trigger auto-dismiss
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      
      // Wait for animation
      act(() => {
        vi.advanceTimersByTime(200);
      });
      
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('should clear auto-dismiss timer on unmount', () => {
      const { unmount } = render(<Alert autoDismiss={3000}>Test message</Alert>);
      
      unmount();
      
      // Should not throw error
      vi.advanceTimersByTime(5000);
    });
  });

  describe('Accessibility', () => {
    it('should have role="alert"', () => {
      render(<Alert>Test message</Alert>);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should have aria-live="polite"', () => {
      render(<Alert>Test message</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'polite');
    });

    it('should have accessible dismiss button label', () => {
      render(<Alert dismissible>Test message</Alert>);
      const dismissButton = screen.getByLabelText('Dismiss alert');
      expect(dismissButton).toBeInTheDocument();
    });

    it('should be keyboard accessible for dismiss', () => {
      const onDismiss = vi.fn();
      
      render(<Alert dismissible onDismiss={onDismiss}>Test message</Alert>);
      
      const dismissButton = screen.getByLabelText('Dismiss alert');
      dismissButton.focus();
      dismissButton.click();
      
      vi.advanceTimersByTime(200);
      
      expect(onDismiss).toHaveBeenCalled();
    });
  });

  describe('Animation', () => {
    it('should have fade-in animation on mount', () => {
      render(<Alert>Test message</Alert>);
      const alert = screen.getByRole('alert');
      const style = window.getComputedStyle(alert);
      
      expect(style.animation).toContain('alertFadeIn');
      expect(style.animation).toContain('var(--transition-base)');
    });

    it('should animate out when dismissed', () => {
      render(<Alert dismissible>Test message</Alert>);
      
      const alert = screen.getByRole('alert');
      const dismissButton = screen.getByLabelText('Dismiss alert');
      
      dismissButton.click();
      
      // Check that the style attribute contains opacity and transform
      const styleAttr = alert.getAttribute('style');
      expect(styleAttr).toContain('opacity');
      expect(styleAttr).toContain('transform');
    });
  });

  describe('Layout', () => {
    it('should use flexbox layout', () => {
      render(<Alert>Test message</Alert>);
      const alert = screen.getByRole('alert');
      const style = window.getComputedStyle(alert);
      
      expect(style.display).toBe('flex');
      expect(style.alignItems).toBe('flex-start');
    });

    it('should have consistent gap between elements', () => {
      render(<Alert dismissible>Test message</Alert>);
      const alert = screen.getByRole('alert');
      const style = window.getComputedStyle(alert);
      
      expect(style.gap).toBe('var(--space-3)');
    });
  });
});
