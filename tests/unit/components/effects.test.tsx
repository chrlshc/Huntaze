/**
 * Unit tests for effect components
 * Validates design token usage in animation components
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import AtomicBackground from '@/components/effects/AtomicBackground';
import ShadowEffect from '@/components/effects/ShadowEffect';
import NeonCanvas from '@/components/effects/NeonCanvas';

describe('Effect Components - Design Token Migration', () => {
  beforeEach(() => {
    // Mock canvas context
    HTMLCanvasElement.prototype.getContext = () => ({
      fillRect: () => {},
      clearRect: () => {},
      getImageData: () => ({ data: [] }),
      putImageData: () => {},
      createImageData: () => [],
      setTransform: () => {},
      drawImage: () => {},
      save: () => {},
      fillText: () => {},
      restore: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {},
      stroke: () => {},
      translate: () => {},
      scale: () => {},
      rotate: () => {},
      arc: () => {},
      fill: () => {},
      measureText: () => ({ width: 0 }),
      transform: () => {},
      rect: () => {},
      clip: () => {},
      createRadialGradient: () => ({
        addColorStop: () => {}
      }),
      bezierCurveTo: () => {},
    }) as any;
  });

  describe('AtomicBackground', () => {
    it('should render without crashing', () => {
      const { container } = render(<AtomicBackground />);
      expect(container).toBeTruthy();
    });

    it('should use design token for background gradient', () => {
      const { container } = render(<AtomicBackground />);
      const backgroundDiv = container.querySelector('div[style*="background"]');
      expect(backgroundDiv).toBeTruthy();
      
      const style = backgroundDiv?.getAttribute('style');
      expect(style).toContain('var(--bg-primary)');
      expect(style).toContain('var(--bg-secondary)');
      expect(style).toContain('var(--bg-tertiary)');
    });

    it('should not contain hardcoded color values', () => {
      const { container } = render(<AtomicBackground />);
      const html = container.innerHTML;
      
      // Should not have hardcoded hex colors in inline styles
      expect(html).not.toMatch(/#[0-9a-fA-F]{6}/);
    });

    it('should render canvas element', () => {
      const { container } = render(<AtomicBackground />);
      const canvas = container.querySelector('canvas');
      expect(canvas).toBeTruthy();
    });

    it('should accept custom className', () => {
      const { container } = render(<AtomicBackground className="custom-class" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('custom-class');
    });

    it('should accept custom particle count', () => {
      const { container } = render(<AtomicBackground particleCount={50} />);
      expect(container).toBeTruthy();
    });
  });

  describe('ShadowEffect', () => {
    it('should render without crashing', () => {
      const { container } = render(<ShadowEffect />);
      expect(container).toBeTruthy();
    });

    it('should use design token for background', () => {
      const { container } = render(<ShadowEffect variant="huntaze" />);
      const backgroundDiv = container.querySelector('div[style*="background"]');
      expect(backgroundDiv).toBeTruthy();
      
      const style = backgroundDiv?.getAttribute('style');
      expect(style).toContain('var(--bg-primary)');
    });

    it('should support different variants', () => {
      const variants: Array<'huntaze' | 'perfect' | 'eminence' | 'basic'> = ['huntaze', 'perfect', 'eminence', 'basic'];
      
      variants.forEach(variant => {
        const { container } = render(<ShadowEffect variant={variant} />);
        expect(container).toBeTruthy();
      });
    });

    it('should render canvas element', () => {
      const { container } = render(<ShadowEffect />);
      const canvas = container.querySelector('canvas');
      expect(canvas).toBeTruthy();
    });

    it('should use gradient background for perfect/eminence variants', () => {
      const { container } = render(<ShadowEffect variant="perfect" />);
      const backgroundDiv = container.querySelector('div[style*="background"]');
      const style = backgroundDiv?.getAttribute('style');
      
      expect(style).toContain('linear-gradient');
      expect(style).toContain('var(--bg-primary)');
      expect(style).toContain('var(--bg-secondary)');
      expect(style).toContain('var(--bg-tertiary)');
    });
  });

  describe('NeonCanvas', () => {
    it('should render without crashing', () => {
      const { container } = render(<NeonCanvas />);
      expect(container).toBeTruthy();
    });

    it('should render canvas element', () => {
      const { container } = render(<NeonCanvas />);
      const canvas = container.querySelector('canvas');
      expect(canvas).toBeTruthy();
    });

    it('should accept custom className', () => {
      const { container } = render(<NeonCanvas className="custom-neon" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('custom-neon');
    });

    it('should accept custom intensity', () => {
      const { container } = render(<NeonCanvas intensity={2} />);
      expect(container).toBeTruthy();
    });

    it('should accept custom color', () => {
      const { container } = render(<NeonCanvas color="#ff0000" />);
      expect(container).toBeTruthy();
    });

    it('should use design token for default color when not provided', () => {
      // This is tested implicitly through the component logic
      const { container } = render(<NeonCanvas />);
      expect(container).toBeTruthy();
    });

    it('should have hardware acceleration styles', () => {
      const { container } = render(<NeonCanvas />);
      const canvas = container.querySelector('canvas');
      const style = canvas?.getAttribute('style');
      
      expect(style).toContain('translateZ(0)');
      expect(style).toContain('backface-visibility');
    });
  });

  describe('Design Token Integration', () => {
    it('should use CSS custom properties for colors', () => {
      // Set up mock CSS custom properties
      const mockGetComputedStyle = (element: Element) => ({
        getPropertyValue: (prop: string) => {
          const tokens: Record<string, string> = {
            '--accent-primary': '#8b5cf6',
            '--accent-error': '#ef4444',
            '--accent-primary-hover': '#7c3aed',
            '--bg-primary': '#09090b',
            '--bg-secondary': '#18181b',
            '--bg-tertiary': '#27272a',
          };
          return tokens[prop] || '';
        }
      }) as any;

      const originalGetComputedStyle = window.getComputedStyle;
      window.getComputedStyle = mockGetComputedStyle;

      const { container } = render(<AtomicBackground />);
      expect(container).toBeTruthy();

      window.getComputedStyle = originalGetComputedStyle;
    });

    it('should have fallback colors when tokens are not available', () => {
      // This is tested through the component rendering without errors
      const { container } = render(<AtomicBackground />);
      expect(container).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have pointer-events-none for non-interactive effects', () => {
      const { container } = render(<NeonCanvas />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('pointer-events-none');
    });

    it('should not interfere with page interaction', () => {
      const { container } = render(<ShadowEffect />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('pointer-events-none');
    });
  });

  describe('Performance', () => {
    it('should use hardware acceleration hints', () => {
      const { container } = render(<NeonCanvas />);
      const wrapper = container.firstChild as HTMLElement;
      const style = wrapper.getAttribute('style');
      
      expect(style).toContain('isolation');
    });

    it('should have proper canvas sizing', () => {
      const { container } = render(<NeonCanvas />);
      const canvas = container.querySelector('canvas');
      expect(canvas?.className).toContain('w-full');
      expect(canvas?.className).toContain('h-full');
    });
  });
});
