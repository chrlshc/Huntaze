/**
 * Unit Tests for Loading States Components
 * Tests skeleton loaders match actual content dimensions
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  FanListSkeleton,
  MessageAreaSkeleton,
  ContextPanelSkeleton,
} from '@/components/messages/LoadingStates';

describe('FanListSkeleton', () => {
  it('should render skeleton with correct test id', () => {
    render(<FanListSkeleton />);
    expect(screen.getByTestId('fan-list-skeleton')).toBeInTheDocument();
  });

  it('should render 8 fan card skeletons', () => {
    const { container } = render(<FanListSkeleton />);
    const skeletonItems = container.querySelectorAll('.flex.items-center.space-x-3');
    expect(skeletonItems).toHaveLength(8);
  });

  it('should have avatar skeleton with correct dimensions', () => {
    const { container } = render(<FanListSkeleton />);
    const avatarSkeleton = container.querySelector('.w-12.h-12.rounded-full');
    expect(avatarSkeleton).toBeInTheDocument();
    expect(avatarSkeleton).toHaveClass('bg-gray-200', 'dark:bg-gray-700');
  });

  it('should have content skeleton with multiple lines', () => {
    const { container } = render(<FanListSkeleton />);
    const firstItem = container.querySelector('.flex.items-center.space-x-3');
    const contentLines = firstItem?.querySelectorAll('.h-4, .h-3');
    expect(contentLines).toHaveLength(3); // Name, preview, and timestamp
  });

  it('should have animate-pulse class for animation', () => {
    const { container } = render(<FanListSkeleton />);
    const skeletonItems = container.querySelectorAll('.animate-pulse');
    expect(skeletonItems.length).toBeGreaterThan(0);
  });
});

describe('MessageAreaSkeleton', () => {
  it('should render skeleton with correct test id', () => {
    render(<MessageAreaSkeleton />);
    expect(screen.getByTestId('message-area-skeleton')).toBeInTheDocument();
  });

  it('should have header section', () => {
    const { container } = render(<MessageAreaSkeleton />);
    const header = container.querySelector('.border-b');
    expect(header).toBeInTheDocument();
  });

  it('should render 5 message skeletons', () => {
    const { container } = render(<MessageAreaSkeleton />);
    const messages = container.querySelectorAll('.flex.justify-start, .flex.justify-end');
    expect(messages).toHaveLength(5);
  });

  it('should alternate message alignment (incoming/outgoing)', () => {
    const { container } = render(<MessageAreaSkeleton />);
    const messages = Array.from(container.querySelectorAll('.flex.justify-start, .flex.justify-end'));
    
    const hasLeftAligned = messages.some(msg => msg.classList.contains('justify-start'));
    const hasRightAligned = messages.some(msg => msg.classList.contains('justify-end'));
    
    expect(hasLeftAligned).toBe(true);
    expect(hasRightAligned).toBe(true);
  });

  it('should have input skeleton at bottom', () => {
    const { container } = render(<MessageAreaSkeleton />);
    const input = container.querySelector('.border-t .h-12');
    expect(input).toBeInTheDocument();
  });

  it('should have full height layout', () => {
    const { container } = render(<MessageAreaSkeleton />);
    const mainContainer = container.querySelector('.flex.flex-col.h-full');
    expect(mainContainer).toBeInTheDocument();
  });
});

describe('ContextPanelSkeleton', () => {
  it('should render skeleton with correct test id', () => {
    render(<ContextPanelSkeleton />);
    expect(screen.getByTestId('context-panel-skeleton')).toBeInTheDocument();
  });

  it('should have large avatar skeleton', () => {
    const { container } = render(<ContextPanelSkeleton />);
    const avatar = container.querySelector('.w-20.h-20.rounded-full');
    expect(avatar).toBeInTheDocument();
  });

  it('should have info section with 3 rows', () => {
    const { container } = render(<ContextPanelSkeleton />);
    const sections = container.querySelectorAll('.space-y-3');
    const infoSection = sections[1]; // Second section is info
    const rows = infoSection?.querySelectorAll('.flex.justify-between');
    expect(rows).toHaveLength(3);
  });

  it('should have notes section with 2 note skeletons', () => {
    const { container } = render(<ContextPanelSkeleton />);
    const noteSkeletons = container.querySelectorAll('.p-3.bg-gray-100');
    expect(noteSkeletons).toHaveLength(2);
  });

  it('should have tags section with 3 tag skeletons', () => {
    const { container } = render(<ContextPanelSkeleton />);
    const tagSkeletons = container.querySelectorAll('.h-6.rounded-full');
    expect(tagSkeletons).toHaveLength(3);
  });

  it('should have proper spacing between sections', () => {
    const { container } = render(<ContextPanelSkeleton />);
    const mainContainer = container.querySelector('.space-y-6');
    expect(mainContainer).toBeInTheDocument();
  });
});

describe('Loading States Integration', () => {
  it('should all skeletons use consistent color scheme', () => {
    const { container: fanList } = render(<FanListSkeleton />);
    const { container: messageArea } = render(<MessageAreaSkeleton />);
    const { container: contextPanel } = render(<ContextPanelSkeleton />);

    const checkColorScheme = (container: HTMLElement) => {
      const skeletons = container.querySelectorAll('[class*="bg-gray-200"]');
      return skeletons.length > 0;
    };

    expect(checkColorScheme(fanList)).toBe(true);
    expect(checkColorScheme(messageArea)).toBe(true);
    expect(checkColorScheme(contextPanel)).toBe(true);
  });

  it('should all skeletons support dark mode', () => {
    const { container: fanList } = render(<FanListSkeleton />);
    const { container: messageArea } = render(<MessageAreaSkeleton />);
    const { container: contextPanel } = render(<ContextPanelSkeleton />);

    const checkDarkMode = (container: HTMLElement) => {
      const darkElements = container.querySelectorAll('[class*="dark:bg-gray-700"]');
      return darkElements.length > 0;
    };

    expect(checkDarkMode(fanList)).toBe(true);
    expect(checkDarkMode(messageArea)).toBe(true);
    expect(checkDarkMode(contextPanel)).toBe(true);
  });
});
