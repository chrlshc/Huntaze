/**
 * ARIA Utilities
 * Task 5.5: Accessibility improvements
 * Requirements: 4.3
 */

/**
 * Generate unique ID for ARIA attributes
 */
let idCounter = 0;
export function generateAriaId(prefix: string = 'aria'): string {
  return `${prefix}-${++idCounter}`;
}

/**
 * ARIA live region announcer
 */
export class AriaAnnouncer {
  private element: HTMLDivElement | null = null;

  constructor() {
    if (typeof document !== 'undefined') {
      this.element = document.createElement('div');
      this.element.setAttribute('role', 'status');
      this.element.setAttribute('aria-live', 'polite');
      this.element.setAttribute('aria-atomic', 'true');
      this.element.className = 'sr-only';
      document.body.appendChild(this.element);
    }
  }

  /**
   * Announce a message to screen readers
   */
  announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    if (!this.element) return;

    this.element.setAttribute('aria-live', priority);
    this.element.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      if (this.element) {
        this.element.textContent = '';
      }
    }, 1000);
  }

  /**
   * Clean up
   */
  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
      this.element = null;
    }
  }
}

/**
 * Global announcer instance
 */
let globalAnnouncer: AriaAnnouncer | null = null;

export function getAnnouncer(): AriaAnnouncer {
  if (!globalAnnouncer) {
    globalAnnouncer = new AriaAnnouncer();
  }
  return globalAnnouncer;
}

/**
 * Announce a message
 */
export function announce(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
) {
  getAnnouncer().announce(message, priority);
}

/**
 * ARIA attributes for common patterns
 */
export const ariaPatterns = {
  /**
   * Button attributes
   */
  button: (label: string, pressed?: boolean, expanded?: boolean) => ({
    role: 'button',
    'aria-label': label,
    ...(pressed !== undefined && { 'aria-pressed': pressed }),
    ...(expanded !== undefined && { 'aria-expanded': expanded }),
  }),

  /**
   * Link attributes
   */
  link: (label: string, current?: boolean) => ({
    role: 'link',
    'aria-label': label,
    ...(current && { 'aria-current': 'page' }),
  }),

  /**
   * Dialog attributes
   */
  dialog: (labelId: string, describedById?: string) => ({
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': labelId,
    ...(describedById && { 'aria-describedby': describedById }),
  }),

  /**
   * Menu attributes
   */
  menu: (label: string) => ({
    role: 'menu',
    'aria-label': label,
  }),

  menuItem: (label: string, disabled?: boolean) => ({
    role: 'menuitem',
    'aria-label': label,
    ...(disabled && { 'aria-disabled': 'true' }),
  }),

  /**
   * Tab attributes
   */
  tabList: (label: string) => ({
    role: 'tablist',
    'aria-label': label,
  }),

  tab: (label: string, selected: boolean, controls: string) => ({
    role: 'tab',
    'aria-label': label,
    'aria-selected': selected,
    'aria-controls': controls,
  }),

  tabPanel: (labelledBy: string) => ({
    role: 'tabpanel',
    'aria-labelledby': labelledBy,
  }),

  /**
   * Form attributes
   */
  formField: (
    labelId: string,
    errorId?: string,
    describedById?: string,
    required?: boolean,
    invalid?: boolean
  ) => ({
    'aria-labelledby': labelId,
    ...(errorId && invalid && { 'aria-describedby': errorId }),
    ...(describedById && { 'aria-describedby': describedById }),
    ...(required && { 'aria-required': 'true' }),
    ...(invalid && { 'aria-invalid': 'true' }),
  }),

  /**
   * Loading state
   */
  loading: (label: string = 'Loading') => ({
    role: 'status',
    'aria-live': 'polite',
    'aria-label': label,
  }),

  /**
   * Alert attributes
   */
  alert: (label: string) => ({
    role: 'alert',
    'aria-live': 'assertive',
    'aria-label': label,
  }),

  /**
   * Progress bar
   */
  progressBar: (
    label: string,
    value: number,
    max: number = 100,
    min: number = 0
  ) => ({
    role: 'progressbar',
    'aria-label': label,
    'aria-valuenow': value,
    'aria-valuemin': min,
    'aria-valuemax': max,
    'aria-valuetext': `${Math.round((value / max) * 100)}%`,
  }),

  /**
   * Tooltip attributes
   */
  tooltip: (id: string) => ({
    role: 'tooltip',
    id,
  }),

  tooltipTrigger: (tooltipId: string) => ({
    'aria-describedby': tooltipId,
  }),
};

/**
 * Focus management utilities
 */
export const focusManagement = {
  /**
   * Trap focus within an element
   */
  trapFocus: (element: HTMLElement) => {
    const focusableElements = element.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    element.addEventListener('keydown', handleKeyDown);

    // Focus first element
    firstElement?.focus();

    return () => {
      element.removeEventListener('keydown', handleKeyDown);
    };
  },

  /**
   * Get all focusable elements
   */
  getFocusableElements: (container: HTMLElement): HTMLElement[] => {
    return Array.from(
      container.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );
  },

  /**
   * Focus first element
   */
  focusFirst: (container: HTMLElement) => {
    const elements = focusManagement.getFocusableElements(container);
    elements[0]?.focus();
  },

  /**
   * Focus last element
   */
  focusLast: (container: HTMLElement) => {
    const elements = focusManagement.getFocusableElements(container);
    elements[elements.length - 1]?.focus();
  },

  /**
   * Save and restore focus
   */
  saveFocus: () => {
    const activeElement = document.activeElement as HTMLElement;
    return () => {
      activeElement?.focus();
    };
  },
};

/**
 * Keyboard navigation utilities
 */
export const keyboardNav = {
  /**
   * Handle arrow key navigation
   */
  handleArrowKeys: (
    e: KeyboardEvent,
    elements: HTMLElement[],
    currentIndex: number,
    orientation: 'horizontal' | 'vertical' = 'horizontal'
  ): number => {
    const isHorizontal = orientation === 'horizontal';
    const nextKey = isHorizontal ? 'ArrowRight' : 'ArrowDown';
    const prevKey = isHorizontal ? 'ArrowLeft' : 'ArrowUp';

    if (e.key === nextKey) {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % elements.length;
      elements[nextIndex]?.focus();
      return nextIndex;
    }

    if (e.key === prevKey) {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + elements.length) % elements.length;
      elements[prevIndex]?.focus();
      return prevIndex;
    }

    if (e.key === 'Home') {
      e.preventDefault();
      elements[0]?.focus();
      return 0;
    }

    if (e.key === 'End') {
      e.preventDefault();
      const lastIndex = elements.length - 1;
      elements[lastIndex]?.focus();
      return lastIndex;
    }

    return currentIndex;
  },

  /**
   * Check if key is printable
   */
  isPrintableKey: (key: string): boolean => {
    return key.length === 1 && /\S/.test(key);
  },

  /**
   * Handle typeahead search
   */
  createTypeaheadHandler: (
    items: Array<{ label: string; element: HTMLElement }>,
    onMatch: (index: number) => void
  ) => {
    let searchString = '';
    let timeoutId: NodeJS.Timeout | null = null;

    return (e: KeyboardEvent) => {
      if (!keyboardNav.isPrintableKey(e.key)) return;

      // Clear timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Add to search string
      searchString += e.key.toLowerCase();

      // Find matching item
      const matchIndex = items.findIndex(item =>
        item.label.toLowerCase().startsWith(searchString)
      );

      if (matchIndex !== -1) {
        onMatch(matchIndex);
        items[matchIndex].element.focus();
      }

      // Clear search string after 500ms
      timeoutId = setTimeout(() => {
        searchString = '';
      }, 500);
    };
  },
};

/**
 * Screen reader utilities
 */
export const screenReader = {
  /**
   * Hide element from screen readers
   */
  hide: (element: HTMLElement) => {
    element.setAttribute('aria-hidden', 'true');
  },

  /**
   * Show element to screen readers
   */
  show: (element: HTMLElement) => {
    element.removeAttribute('aria-hidden');
  },

  /**
   * Make element screen reader only
   */
  srOnly: (element: HTMLElement) => {
    element.className += ' sr-only';
  },
};
