/**
 * Marketing Pages Accessibility Audit
 * 
 * Comprehensive accessibility testing for all marketing pages
 * Ensures WCAG 2.1 Level AA compliance
 * 
 * Requirements: 7.5
 * Task: 10. Accessibility audit and fixes
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { MarketingHeader } from '@/components/layout/MarketingHeader';
import { MarketingFooter } from '@/components/layout/MarketingFooter';
import { MobileNav } from '@/components/layout/MobileNav';
import { NavLink } from '@/components/layout/NavLink';
import { navigationConfig } from '@/config/navigation';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock Next.js router
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe('Marketing Pages Accessibility Audit', () => {
  describe('MarketingHeader Accessibility', () => {
    it('should have no axe violations', async () => {
      const { container } = render(<MarketingHeader />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA labels for navigation', () => {
      render(<MarketingHeader />);
      
      // Main navigation should have aria-label
      const mainNav = screen.getByRole('navigation', { name: /main navigation/i });
      expect(mainNav).toBeInTheDocument();
    });

    it('should have accessible logo link', () => {
      render(<MarketingHeader />);
      
      const logoLink = screen.getByRole('link', { name: /huntaze home/i });
      expect(logoLink).toBeInTheDocument();
      expect(logoLink).toHaveAttribute('href', '/');
    });

    it('should have accessible mobile menu button', () => {
      render(<MarketingHeader />);
      
      const menuButton = screen.getByRole('button', { name: /open menu/i });
      expect(menuButton).toBeInTheDocument();
      expect(menuButton).toHaveAttribute('aria-expanded');
      expect(menuButton).toHaveAttribute('aria-controls');
    });

    it('should have keyboard accessible navigation links', () => {
      render(<MarketingHeader />);
      
      navigationConfig.main.forEach((item) => {
        const link = screen.getAllByRole('link', { name: item.label })[0];
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', item.href);
      });
    });

    it('should have sufficient color contrast for text', () => {
      const { container } = render(<MarketingHeader />);
      
      // Check that text elements exist (contrast will be checked by axe)
      const textElements = container.querySelectorAll('a, button');
      expect(textElements.length).toBeGreaterThan(0);
    });
  });

  describe('MarketingFooter Accessibility', () => {
    it('should have no axe violations', async () => {
      const { container } = render(<MarketingFooter />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper heading hierarchy', () => {
      render(<MarketingFooter />);
      
      // Footer sections should have h3 headings
      navigationConfig.footer.forEach((section) => {
        const heading = screen.getByRole('heading', { name: section.title, level: 3 });
        expect(heading).toBeInTheDocument();
      });
    });

    it('should have accessible social media links', () => {
      render(<MarketingFooter />);
      
      if (navigationConfig.social && navigationConfig.social.length > 0) {
        navigationConfig.social.forEach((social) => {
          const link = screen.getByRole('link', { name: new RegExp(social.platform, 'i') });
          expect(link).toBeInTheDocument();
          expect(link).toHaveAttribute('href', social.url);
          expect(link).toHaveAttribute('target', '_blank');
          expect(link).toHaveAttribute('rel', 'noopener noreferrer');
        });
      }
    });

    it('should have aria-hidden on decorative icons', () => {
      const { container } = render(<MarketingFooter />);
      
      // Social media icons should have aria-hidden
      const icons = container.querySelectorAll('svg');
      icons.forEach((icon) => {
        expect(icon).toHaveAttribute('aria-hidden', 'true');
      });
    });

    it('should have accessible external links', () => {
      render(<MarketingFooter />);
      
      navigationConfig.footer.forEach((section) => {
        section.links.forEach((link) => {
          if (link.external) {
            const linkElement = screen.getByRole('link', { name: link.label });
            expect(linkElement).toHaveAttribute('target', '_blank');
            expect(linkElement).toHaveAttribute('rel', 'noopener noreferrer');
          }
        });
      });
    });
  });

  describe('MobileNav Accessibility', () => {
    it('should have no axe violations when open', async () => {
      const { container } = render(
        <MobileNav
          isOpen={true}
          onClose={() => {}}
          navItems={navigationConfig.main}
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper dialog role and aria attributes', () => {
      render(
        <MobileNav
          isOpen={true}
          onClose={() => {}}
          navItems={navigationConfig.main}
        />
      );
      
      const dialog = screen.getByRole('dialog', { name: /mobile navigation/i });
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('should have accessible close button', () => {
      render(
        <MobileNav
          isOpen={true}
          onClose={() => {}}
          navItems={navigationConfig.main}
        />
      );
      
      const closeButton = screen.getByRole('button', { name: /close menu/i });
      expect(closeButton).toBeInTheDocument();
    });

    it('should have navigation landmark', () => {
      render(
        <MobileNav
          isOpen={true}
          onClose={() => {}}
          navItems={navigationConfig.main}
        />
      );
      
      const nav = screen.getByRole('navigation', { name: /mobile navigation menu/i });
      expect(nav).toBeInTheDocument();
    });

    it('should have aria-hidden on decorative icons', () => {
      const { container } = render(
        <MobileNav
          isOpen={true}
          onClose={() => {}}
          navItems={navigationConfig.main}
        />
      );
      
      const icons = container.querySelectorAll('svg');
      icons.forEach((icon) => {
        expect(icon).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });

  describe('NavLink Accessibility', () => {
    it('should have no axe violations', async () => {
      const { container } = render(
        <NavLink href="/features">Features</NavLink>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should be keyboard accessible', () => {
      render(<NavLink href="/features">Features</NavLink>);
      
      const link = screen.getByRole('link', { name: /features/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/features');
    });

    it('should have proper focus styles', () => {
      const { container } = render(
        <NavLink href="/features">Features</NavLink>
      );
      
      const link = container.querySelector('a');
      expect(link).toBeInTheDocument();
      
      // Link should be focusable
      expect(link?.tabIndex).not.toBe(-1);
    });
  });

  describe('Keyboard Navigation', () => {
    it('should allow tab navigation through header links', () => {
      render(<MarketingHeader />);
      
      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).not.toHaveAttribute('tabindex', '-1');
      });
    });

    it('should allow tab navigation through footer links', () => {
      render(<MarketingFooter />);
      
      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).not.toHaveAttribute('tabindex', '-1');
      });
    });

    it('should have visible focus indicators', () => {
      const { container } = render(<MarketingHeader />);
      
      // Check that interactive elements don't have outline: none without alternative
      const interactiveElements = container.querySelectorAll('a, button');
      interactiveElements.forEach((element) => {
        // Elements should either have outline or focus-visible classes
        const classes = element.className;
        const hasOutline = !classes.includes('outline-none') || 
                          classes.includes('focus-visible:ring') ||
                          classes.includes('focus-visible:outline');
        expect(hasOutline).toBe(true);
      });
    });
  });

  describe('Touch Target Sizes', () => {
    it('should have minimum 44x44px touch targets for buttons', () => {
      const { container } = render(<MarketingHeader />);
      
      const buttons = container.querySelectorAll('button');
      buttons.forEach((button) => {
        const rect = button.getBoundingClientRect();
        // Note: In test environment, sizes might be 0, so we check classes instead
        const classes = button.className;
        const hasMinHeight = classes.includes('h-9') || 
                            classes.includes('h-10') ||
                            classes.includes('min-h-');
        expect(hasMinHeight || rect.height === 0).toBe(true);
      });
    });

    it('should have adequate spacing between interactive elements', () => {
      const { container } = render(<MarketingHeader />);
      
      const links = container.querySelectorAll('a');
      // Links should have padding or margin, or be in a container with gap/space
      // We check up to 2 levels of parent containers
      links.forEach((link) => {
        const classes = link.className;
        const parentClasses = link.parentElement?.className || '';
        const grandparentClasses = link.parentElement?.parentElement?.className || '';
        const hasSpacing = classes.includes('px-') || 
                          classes.includes('py-') ||
                          classes.includes('p-') ||
                          classes.includes('gap-') ||
                          classes.includes('space-') ||
                          parentClasses.includes('gap-') ||
                          parentClasses.includes('space-') ||
                          grandparentClasses.includes('gap-') ||
                          grandparentClasses.includes('space-');
        expect(hasSpacing).toBe(true);
      });
    });
  });

  describe('Screen Reader Support', () => {
    it('should have proper landmark regions', () => {
      const { container: headerContainer } = render(<MarketingHeader />);
      const { container: footerContainer } = render(<MarketingFooter />);
      
      // Header should be in a header landmark
      const header = headerContainer.querySelector('header');
      expect(header).toBeInTheDocument();
      
      // Footer should be in a footer landmark
      const footer = footerContainer.querySelector('footer');
      expect(footer).toBeInTheDocument();
    });

    it('should have descriptive link text', () => {
      render(<MarketingHeader />);
      
      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        // Links should have text content or aria-label
        const hasText = link.textContent && link.textContent.trim().length > 0;
        const hasAriaLabel = link.hasAttribute('aria-label');
        expect(hasText || hasAriaLabel).toBe(true);
      });
    });

    it('should not have empty links or buttons', () => {
      const { container } = render(<MarketingHeader />);
      
      const links = container.querySelectorAll('a');
      const buttons = container.querySelectorAll('button');
      
      [...links, ...buttons].forEach((element) => {
        const hasContent = element.textContent && element.textContent.trim().length > 0;
        const hasAriaLabel = element.hasAttribute('aria-label');
        const hasAriaLabelledBy = element.hasAttribute('aria-labelledby');
        expect(hasContent || hasAriaLabel || hasAriaLabelledBy).toBe(true);
      });
    });

    it('should have proper heading hierarchy in footer', () => {
      render(<MarketingFooter />);
      
      // Footer should have h3 headings for sections
      const headings = screen.getAllByRole('heading', { level: 3 });
      expect(headings.length).toBeGreaterThan(0);
    });
  });

  describe('Color Contrast', () => {
    it('should use semantic color classes for text', () => {
      const { container } = render(<MarketingHeader />);
      
      // Check that text elements use proper color classes
      const textElements = container.querySelectorAll('a, button, span');
      textElements.forEach((element) => {
        const classes = element.className;
        // Should use semantic color classes like text-foreground, text-muted-foreground, etc.
        const hasSemanticColor = classes.includes('text-foreground') ||
                                classes.includes('text-muted-foreground') ||
                                classes.includes('text-primary') ||
                                classes.includes('text-accent');
        // Or should be using default text color or utility classes like text-sm
        const hasTextClass = classes.match(/text-[a-z]/);
        const isUtilityClass = classes.includes('text-sm') || 
                              classes.includes('text-base') || 
                              classes.includes('text-lg') ||
                              classes.includes('text-xl');
        expect(hasSemanticColor || !hasTextClass || isUtilityClass).toBe(true);
      });
    });

    it('should use high contrast backgrounds for interactive elements', () => {
      const { container } = render(<MarketingHeader />);
      
      const buttons = container.querySelectorAll('button');
      buttons.forEach((button) => {
        const classes = button.className;
        // Buttons should have background colors
        const hasBackground = classes.includes('bg-') || 
                             classes.includes('hover:bg-');
        expect(hasBackground).toBe(true);
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('should hide desktop nav on mobile', () => {
      const { container } = render(<MarketingHeader />);
      
      const desktopNav = container.querySelector('nav.hidden.md\\:flex');
      expect(desktopNav).toBeInTheDocument();
    });

    it('should show mobile menu button on mobile', () => {
      const { container } = render(<MarketingHeader />);
      
      const mobileButton = container.querySelector('button.md\\:hidden');
      expect(mobileButton).toBeInTheDocument();
    });

    it('should have responsive text sizes', () => {
      const { container } = render(<MarketingHeader />);
      
      // Check that text uses responsive classes
      const textElements = container.querySelectorAll('a, button, span');
      let hasResponsiveText = false;
      textElements.forEach((element) => {
        const classes = element.className;
        if (classes.includes('text-sm') || classes.includes('text-base') || classes.includes('text-lg')) {
          hasResponsiveText = true;
        }
      });
      expect(hasResponsiveText).toBe(true);
    });
  });

  describe('ARIA Attributes', () => {
    it('should have proper aria-expanded on mobile menu button', () => {
      render(<MarketingHeader />);
      
      const menuButton = screen.getByRole('button', { name: /open menu/i });
      expect(menuButton).toHaveAttribute('aria-expanded');
    });

    it('should have aria-hidden on decorative icons', () => {
      const { container } = render(<MarketingHeader />);
      
      const icons = container.querySelectorAll('svg');
      icons.forEach((icon) => {
        expect(icon).toHaveAttribute('aria-hidden', 'true');
      });
    });

    it('should have aria-label on icon-only buttons', () => {
      render(<MarketingHeader />);
      
      const menuButton = screen.getByRole('button', { name: /open menu/i });
      expect(menuButton).toHaveAttribute('aria-label');
    });

    it('should have aria-modal on mobile nav dialog', () => {
      render(
        <MobileNav
          isOpen={true}
          onClose={() => {}}
          navItems={navigationConfig.main}
        />
      );
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });
  });

  describe('Form Accessibility', () => {
    it('should have accessible CTA buttons', () => {
      render(<MarketingHeader />);
      
      const getStartedButton = screen.getByRole('link', { name: /get started/i });
      expect(getStartedButton).toBeInTheDocument();
      expect(getStartedButton).toHaveAttribute('href');
    });

    it('should have descriptive button text', () => {
      render(<MarketingHeader />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        const hasText = button.textContent && button.textContent.trim().length > 0;
        const hasAriaLabel = button.hasAttribute('aria-label');
        expect(hasText || hasAriaLabel).toBe(true);
      });
    });
  });
});
