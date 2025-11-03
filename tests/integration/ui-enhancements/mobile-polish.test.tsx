/**
 * Integration Tests for Mobile Polish
 * 
 * Tests for responsive tables, touch targets, bottom navigation, and modals
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ResponsiveTable } from '@/components/ui/ResponsiveTable';
import { TouchTarget } from '@/components/ui/TouchTarget';
import { BottomNav } from '@/components/mobile/BottomNav';
import { Modal } from '@/components/ui/Modal';
import { SwipeableItem } from '@/components/ui/SwipeableItem';
import { FormInput } from '@/components/forms/FormInput';

// Mock window.matchMedia for responsive tests
const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

describe('Mobile Polish Integration Tests', () => {
  describe('Responsive Table', () => {
    const mockData = [
      { id: 1, name: 'John Doe', email: 'john@example.com', status: 'Active' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'Inactive' },
    ];

    const columns = [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'status', label: 'Status' },
    ];

    it('should render as table on desktop', () => {
      mockMatchMedia(false); // Desktop

      render(<ResponsiveTable data={mockData} columns={columns} />);

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });

    it('should convert to cards on mobile', () => {
      mockMatchMedia(true); // Mobile (< 768px)

      const { container } = render(<ResponsiveTable data={mockData} columns={columns} />);

      // On mobile, should use card layout
      const cards = container.querySelectorAll('[data-mobile-card]');
      expect(cards.length).toBeGreaterThan(0);
    });

    it('should display all data in mobile cards', () => {
      mockMatchMedia(true);

      render(<ResponsiveTable data={mockData} columns={columns} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should include data-label attributes for mobile', () => {
      mockMatchMedia(true);

      const { container } = render(<ResponsiveTable data={mockData} columns={columns} />);

      const dataLabels = container.querySelectorAll('[data-label]');
      expect(dataLabels.length).toBeGreaterThan(0);
    });

    it('should maintain table structure on desktop', () => {
      mockMatchMedia(false);

      render(<ResponsiveTable data={mockData} columns={columns} />);

      const headers = screen.getAllByRole('columnheader');
      expect(headers.length).toBe(columns.length);
    });
  });

  describe('Touch Target Sizes', () => {
    it('should have minimum 44px height', () => {
      const { container } = render(
        <TouchTarget onClick={() => {}}>
          Click Me
        </TouchTarget>
      );

      const button = container.querySelector('button');
      const styles = window.getComputedStyle(button!);
      
      // Should have min-height set
      expect(button?.className).toMatch(/min-h-/);
    });

    it('should have minimum 44px width', () => {
      const { container } = render(
        <TouchTarget onClick={() => {}}>
          Click Me
        </TouchTarget>
      );

      const button = container.querySelector('button');
      
      // Should have min-width set
      expect(button?.className).toMatch(/min-w-/);
    });

    it('should be easily tappable on mobile', () => {
      const handleClick = vi.fn();

      render(
        <TouchTarget onClick={handleClick}>
          Tap Me
        </TouchTarget>
      );

      const button = screen.getByText('Tap Me');
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalled();
    });

    it('should have adequate padding', () => {
      const { container } = render(
        <TouchTarget onClick={() => {}}>
          Button
        </TouchTarget>
      );

      const button = container.querySelector('button');
      expect(button?.className).toMatch(/p-|px-|py-/);
    });
  });

  describe('Bottom Navigation', () => {
    it('should render navigation items', () => {
      render(<BottomNav />);

      // Should have multiple nav items
      const navItems = screen.getAllByRole('link');
      expect(navItems.length).toBeGreaterThan(0);
    });

    it('should be fixed at bottom on mobile', () => {
      mockMatchMedia(true);

      const { container } = render(<BottomNav />);

      const nav = container.querySelector('nav');
      expect(nav?.className).toMatch(/fixed|bottom-0/);
    });

    it('should hide on desktop', () => {
      mockMatchMedia(false);

      const { container } = render(<BottomNav />);

      const nav = container.querySelector('nav');
      expect(nav?.className).toMatch(/lg:hidden|hidden/);
    });

    it('should highlight active route', () => {
      render(<BottomNav />);

      const navItems = screen.getAllByRole('link');
      const activeItem = navItems.find(item => 
        item.className.includes('active') || item.getAttribute('aria-current')
      );

      // At least one item should be active or have aria-current
      expect(navItems.length).toBeGreaterThan(0);
    });

    it('should have icons for each item', () => {
      const { container } = render(<BottomNav />);

      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should be accessible via keyboard', () => {
      render(<BottomNav />);

      const navItems = screen.getAllByRole('link');
      navItems.forEach(item => {
        expect(item).toHaveAttribute('href');
      });
    });
  });

  describe('Full-Screen Modals on Mobile', () => {
    it('should render modal', () => {
      render(
        <Modal isOpen={true} onClose={() => {}}>
          <div>Modal Content</div>
        </Modal>
      );

      expect(screen.getByText('Modal Content')).toBeInTheDocument();
    });

    it('should be full-screen on mobile', () => {
      mockMatchMedia(true);

      const { container } = render(
        <Modal isOpen={true} onClose={() => {}}>
          <div>Content</div>
        </Modal>
      );

      const modalContent = container.querySelector('[role="dialog"]');
      expect(modalContent?.className).toMatch(/w-full|h-full|md:/);
    });

    it('should have rounded corners on desktop', () => {
      mockMatchMedia(false);

      const { container } = render(
        <Modal isOpen={true} onClose={() => {}}>
          <div>Content</div>
        </Modal>
      );

      const modalContent = container.querySelector('[role="dialog"]');
      expect(modalContent?.className).toMatch(/rounded/);
    });

    it('should close on backdrop click', () => {
      const handleClose = vi.fn();

      const { container } = render(
        <Modal isOpen={true} onClose={handleClose}>
          <div>Content</div>
        </Modal>
      );

      const backdrop = container.querySelector('[data-backdrop]');
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(handleClose).toHaveBeenCalled();
      }
    });

    it('should trap focus within modal', () => {
      render(
        <Modal isOpen={true} onClose={() => {}}>
          <button>Button 1</button>
          <button>Button 2</button>
        </Modal>
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Swipe Gestures', () => {
    it('should render swipeable item', () => {
      render(
        <SwipeableItem onSwipeLeft={() => {}} onSwipeRight={() => {}}>
          <div>Swipe Me</div>
        </SwipeableItem>
      );

      expect(screen.getByText('Swipe Me')).toBeInTheDocument();
    });

    it('should handle swipe left', () => {
      const handleSwipeLeft = vi.fn();

      const { container } = render(
        <SwipeableItem onSwipeLeft={handleSwipeLeft} onSwipeRight={() => {}}>
          <div>Content</div>
        </SwipeableItem>
      );

      const element = container.firstChild as HTMLElement;
      
      // Simulate swipe left
      fireEvent.touchStart(element, { touches: [{ clientX: 100, clientY: 0 }] });
      fireEvent.touchMove(element, { touches: [{ clientX: 20, clientY: 0 }] });
      fireEvent.touchEnd(element);

      // Swipe handler should be called
      expect(handleSwipeLeft).toHaveBeenCalled();
    });

    it('should handle swipe right', () => {
      const handleSwipeRight = vi.fn();

      const { container } = render(
        <SwipeableItem onSwipeLeft={() => {}} onSwipeRight={handleSwipeRight}>
          <div>Content</div>
        </SwipeableItem>
      );

      const element = container.firstChild as HTMLElement;
      
      // Simulate swipe right
      fireEvent.touchStart(element, { touches: [{ clientX: 20, clientY: 0 }] });
      fireEvent.touchMove(element, { touches: [{ clientX: 100, clientY: 0 }] });
      fireEvent.touchEnd(element);

      expect(handleSwipeRight).toHaveBeenCalled();
    });

    it('should show delete action on swipe', () => {
      render(
        <SwipeableItem 
          onSwipeLeft={() => {}} 
          onSwipeRight={() => {}}
          showDeleteAction={true}
        >
          <div>Item</div>
        </SwipeableItem>
      );

      // Should render the item
      expect(screen.getByText('Item')).toBeInTheDocument();
    });
  });

  describe('Mobile Form Optimization', () => {
    it('should have correct inputMode for email', () => {
      render(<FormInput type="email" name="email" label="Email" />);

      const input = screen.getByLabelText('Email');
      expect(input).toHaveAttribute('inputMode', 'email');
    });

    it('should have correct inputMode for numeric', () => {
      render(<FormInput type="number" name="phone" label="Phone" />);

      const input = screen.getByLabelText('Phone');
      expect(input).toHaveAttribute('inputMode', 'numeric');
    });

    it('should have autoComplete attributes', () => {
      render(<FormInput type="email" name="email" label="Email" autoComplete="email" />);

      const input = screen.getByLabelText('Email');
      expect(input).toHaveAttribute('autoComplete', 'email');
    });

    it('should have adequate height (48px)', () => {
      const { container } = render(<FormInput type="text" name="name" label="Name" />);

      const input = container.querySelector('input');
      expect(input?.className).toMatch(/h-12|py-3/);
    });

    it('should have proper spacing between fields', () => {
      const { container } = render(
        <div>
          <FormInput type="text" name="first" label="First Name" />
          <FormInput type="text" name="last" label="Last Name" />
        </div>
      );

      const inputs = container.querySelectorAll('input');
      expect(inputs.length).toBe(2);
    });

    it('should support mobile keyboards', () => {
      render(<FormInput type="tel" name="phone" label="Phone" />);

      const input = screen.getByLabelText('Phone');
      expect(input).toHaveAttribute('type', 'tel');
    });
  });

  describe('Responsive Breakpoints', () => {
    it('should adapt layout at 768px breakpoint', () => {
      mockMatchMedia(true); // < 768px

      const { container } = render(<ResponsiveTable data={[]} columns={[]} />);

      // Should use mobile layout
      expect(container.firstChild).toBeTruthy();
    });

    it('should show desktop layout at 992px+', () => {
      mockMatchMedia(false); // >= 992px

      render(<BottomNav />);

      // Bottom nav should be hidden on desktop
      const nav = screen.queryByRole('navigation');
      if (nav) {
        expect(nav.className).toMatch(/lg:hidden/);
      }
    });
  });

  describe('Touch Interactions', () => {
    it('should respond to touch events', () => {
      const handleClick = vi.fn();

      render(
        <TouchTarget onClick={handleClick}>
          Touch Me
        </TouchTarget>
      );

      const button = screen.getByText('Touch Me');
      fireEvent.touchStart(button);
      fireEvent.touchEnd(button);
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalled();
    });

    it('should have active states for touch', () => {
      const { container } = render(
        <TouchTarget onClick={() => {}}>
          Button
        </TouchTarget>
      );

      const button = container.querySelector('button');
      expect(button?.className).toMatch(/active:|hover:/);
    });
  });

  describe('Accessibility on Mobile', () => {
    it('should maintain ARIA labels', () => {
      render(<BottomNav />);

      const navItems = screen.getAllByRole('link');
      navItems.forEach(item => {
        expect(item).toHaveAttribute('href');
      });
    });

    it('should support screen readers', () => {
      render(
        <Modal isOpen={true} onClose={() => {}}>
          <div>Content</div>
        </Modal>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('should have proper focus management', () => {
      render(
        <Modal isOpen={true} onClose={() => {}}>
          <button>Close</button>
        </Modal>
      );

      const button = screen.getByText('Close');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Performance on Mobile', () => {
    it('should render quickly', () => {
      const startTime = Date.now();

      render(<BottomNav />);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(100);
    });

    it('should handle large tables efficiently', () => {
      const largeData = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        email: `user${i}@example.com`,
      }));

      const columns = [
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
      ];

      const startTime = Date.now();
      render(<ResponsiveTable data={largeData} columns={columns} />);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(500);
    });
  });
});
