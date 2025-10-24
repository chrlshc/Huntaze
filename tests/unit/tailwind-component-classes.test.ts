import { describe, it, expect, beforeAll } from 'vitest';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import tailwindConfig from '../../tailwind.config.js';

describe('Tailwind Component Classes', () => {
  let css: string;

  beforeAll(async () => {
    // Generate CSS from Tailwind config
    const result = await postcss([
      tailwindcss(tailwindConfig)
    ]).process('@tailwind base; @tailwind components; @tailwind utilities;', {
      from: undefined
    });
    
    css = result.css;
  });

  describe('Button Components', () => {
    it('should generate base button class', () => {
      expect(css).toContain('.btn');
    });

    it('should generate button variant classes', () => {
      expect(css).toContain('.btn-primary');
      expect(css).toContain('.btn-secondary');
      expect(css).toContain('.btn-outline');
      expect(css).toContain('.btn-ghost');
      expect(css).toContain('.btn-danger');
    });

    it('should have proper button styling properties', () => {
      // Check that button classes contain expected properties
      expect(css).toMatch(/\.btn[^{]*{[^}]*display:\s*inline-flex/);
      expect(css).toMatch(/\.btn[^{]*{[^}]*align-items:\s*center/);
      expect(css).toMatch(/\.btn[^{]*{[^}]*justify-content:\s*center/);
    });
  });

  describe('Card Components', () => {
    it('should generate card component classes', () => {
      expect(css).toContain('.card');
      expect(css).toContain('.card-header');
      expect(css).toContain('.card-body');
      expect(css).toContain('.card-footer');
    });

    it('should have proper card styling', () => {
      expect(css).toMatch(/\.card[^{]*{[^}]*background-color:\s*#ffffff/);
      expect(css).toMatch(/\.card[^{]*{[^}]*border-radius:/);
      expect(css).toMatch(/\.card[^{]*{[^}]*box-shadow:/);
    });
  });

  describe('Form Components', () => {
    it('should generate form component classes', () => {
      expect(css).toContain('.form-input');
      expect(css).toContain('.form-label');
      expect(css).toContain('.form-error');
      expect(css).toContain('.form-help');
    });

    it('should have proper form input styling', () => {
      expect(css).toMatch(/\.form-input[^{]*{[^}]*display:\s*block/);
      expect(css).toMatch(/\.form-input[^{]*{[^}]*width:\s*100%/);
      expect(css).toMatch(/\.form-input[^{]*{[^}]*border:/);
    });
  });

  describe('Badge Components', () => {
    it('should generate badge component classes', () => {
      expect(css).toContain('.badge');
      expect(css).toContain('.badge-success');
      expect(css).toContain('.badge-warning');
      expect(css).toContain('.badge-error');
      expect(css).toContain('.badge-info');
      expect(css).toContain('.badge-neutral');
    });

    it('should generate status badge classes', () => {
      expect(css).toContain('.status-pending');
      expect(css).toContain('.status-confirmed');
      expect(css).toContain('.status-processing');
      expect(css).toContain('.status-shipped');
      expect(css).toContain('.status-delivered');
      expect(css).toContain('.status-cancelled');
    });

    it('should have proper badge styling', () => {
      expect(css).toMatch(/\.badge[^{]*{[^}]*display:\s*inline-flex/);
      expect(css).toMatch(/\.badge[^{]*{[^}]*align-items:\s*center/);
      expect(css).toMatch(/\.badge[^{]*{[^}]*border-radius:/);
    });
  });

  describe('Utility Classes', () => {
    it('should generate custom utility classes', () => {
      expect(css).toContain('.text-balance');
      expect(css).toContain('.scrollbar-hide');
      expect(css).toContain('.safe-top');
      expect(css).toContain('.safe-bottom');
    });

    it('should have proper utility styling', () => {
      expect(css).toMatch(/\.scrollbar-hide[^{]*{[^}]*-ms-overflow-style:\s*none/);
      expect(css).toMatch(/\.scrollbar-hide[^{]*{[^}]*scrollbar-width:\s*none/);
    });
  });

  describe('Color Usage in Components', () => {
    it('should use new content colors in components', () => {
      // Check that content colors are used in form labels
      expect(css).toMatch(/\.form-label[^{]*{[^}]*color:\s*#171717/);
    });

    it('should use new surface colors in components', () => {
      // Check that surface colors are used in cards
      expect(css).toMatch(/\.card[^{]*{[^}]*background-color:\s*#ffffff/);
    });

    it('should use new border colors in components', () => {
      // Check that border colors are used in form inputs
      expect(css).toMatch(/border-color:\s*#e5e5e5/);
    });

    it('should use semantic colors in badge variants', () => {
      // Check that success colors are used in success badges
      expect(css).toMatch(/\.badge-success[^{]*{[^}]*background-color:\s*#dcfce7/);
      expect(css).toMatch(/\.badge-success[^{]*{[^}]*color:\s*#166534/);
    });
  });

  describe('Responsive Behavior', () => {
    it('should include responsive utilities', () => {
      // Check for responsive prefixes
      expect(css).toMatch(/@media \(min-width: 475px\)/); // xs breakpoint
      expect(css).toMatch(/@media \(min-width: 640px\)/); // sm breakpoint
      expect(css).toMatch(/@media \(min-width: 768px\)/); // md breakpoint
    });
  });

  describe('Dark Mode Support', () => {
    it('should include dark mode variants', () => {
      // Check for dark mode class variants
      expect(css).toMatch(/\.dark\s+/);
    });
  });
});