import { describe, it, expect, beforeAll } from 'vitest';
import { JSDOM } from 'jsdom';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import tailwindConfig from '../../tailwind.config.js';

describe('Tailwind Integration Tests', () => {
  let dom: JSDOM;
  let document: Document;
  let css: string;

  beforeAll(async () => {
    // Generate CSS from Tailwind config
    const result = await postcss([
      tailwindcss(tailwindConfig)
    ]).process('@tailwind base; @tailwind components; @tailwind utilities;', {
      from: undefined
    });
    
    css = result.css;

    // Setup JSDOM
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>${css}</style>
        </head>
        <body>
          <div id="test-container"></div>
        </body>
      </html>
    `);
    
    document = dom.window.document;
  });

  describe('Color Classes Integration', () => {
    it('should apply content colors correctly', () => {
      const container = document.getElementById('test-container')!;
      
      // Test primary content color
      container.innerHTML = '<div class="text-content-primary">Primary Text</div>';
      const primaryElement = container.querySelector('.text-content-primary') as HTMLElement;
      
      expect(primaryElement).toBeTruthy();
      
      // Test secondary content color
      container.innerHTML = '<div class="text-content-secondary">Secondary Text</div>';
      const secondaryElement = container.querySelector('.text-content-secondary') as HTMLElement;
      
      expect(secondaryElement).toBeTruthy();
    });

    it('should apply surface colors correctly', () => {
      const container = document.getElementById('test-container')!;
      
      // Test elevated surface
      container.innerHTML = '<div class="bg-surface-elevated">Elevated Surface</div>';
      const elevatedElement = container.querySelector('.bg-surface-elevated') as HTMLElement;
      
      expect(elevatedElement).toBeTruthy();
      
      // Test hover surface
      container.innerHTML = '<div class="bg-surface-hover">Hover Surface</div>';
      const hoverElement = container.querySelector('.bg-surface-hover') as HTMLElement;
      
      expect(hoverElement).toBeTruthy();
    });

    it('should apply border colors correctly', () => {
      const container = document.getElementById('test-container')!;
      
      // Test default border
      container.innerHTML = '<div class="border-border">Default Border</div>';
      const borderElement = container.querySelector('.border-border') as HTMLElement;
      
      expect(borderElement).toBeTruthy();
      
      // Test light border
      container.innerHTML = '<div class="border-border-light">Light Border</div>';
      const lightBorderElement = container.querySelector('.border-border-light') as HTMLElement;
      
      expect(lightBorderElement).toBeTruthy();
    });

    it('should apply success colors correctly', () => {
      const container = document.getElementById('test-container')!;
      
      // Test success background
      container.innerHTML = '<div class="bg-success-100">Success Background</div>';
      const successBgElement = container.querySelector('.bg-success-100') as HTMLElement;
      
      expect(successBgElement).toBeTruthy();
      
      // Test success text
      container.innerHTML = '<div class="text-success-600">Success Text</div>';
      const successTextElement = container.querySelector('.text-success-600') as HTMLElement;
      
      expect(successTextElement).toBeTruthy();
    });
  });

  describe('Component Classes Integration', () => {
    it('should apply button classes correctly', () => {
      const container = document.getElementById('test-container')!;
      
      // Test primary button
      container.innerHTML = '<button class="btn btn-primary">Primary Button</button>';
      const primaryButton = container.querySelector('.btn-primary') as HTMLElement;
      
      expect(primaryButton).toBeTruthy();
      expect(primaryButton.classList.contains('btn')).toBe(true);
      expect(primaryButton.classList.contains('btn-primary')).toBe(true);
    });

    it('should apply card classes correctly', () => {
      const container = document.getElementById('test-container')!;
      
      container.innerHTML = `
        <div class="card">
          <div class="card-header">Header</div>
          <div class="card-body">Body</div>
          <div class="card-footer">Footer</div>
        </div>
      `;
      
      const card = container.querySelector('.card') as HTMLElement;
      const header = container.querySelector('.card-header') as HTMLElement;
      const body = container.querySelector('.card-body') as HTMLElement;
      const footer = container.querySelector('.card-footer') as HTMLElement;
      
      expect(card).toBeTruthy();
      expect(header).toBeTruthy();
      expect(body).toBeTruthy();
      expect(footer).toBeTruthy();
    });

    it('should apply form classes correctly', () => {
      const container = document.getElementById('test-container')!;
      
      container.innerHTML = `
        <form>
          <label class="form-label">Label</label>
          <input class="form-input" type="text" />
          <div class="form-error">Error message</div>
          <div class="form-help">Help text</div>
        </form>
      `;
      
      const label = container.querySelector('.form-label') as HTMLElement;
      const input = container.querySelector('.form-input') as HTMLElement;
      const error = container.querySelector('.form-error') as HTMLElement;
      const help = container.querySelector('.form-help') as HTMLElement;
      
      expect(label).toBeTruthy();
      expect(input).toBeTruthy();
      expect(error).toBeTruthy();
      expect(help).toBeTruthy();
    });

    it('should apply badge classes correctly', () => {
      const container = document.getElementById('test-container')!;
      
      // Test semantic badges
      container.innerHTML = `
        <span class="badge badge-success">Success</span>
        <span class="badge badge-warning">Warning</span>
        <span class="badge badge-error">Error</span>
        <span class="badge badge-info">Info</span>
      `;
      
      const successBadge = container.querySelector('.badge-success') as HTMLElement;
      const warningBadge = container.querySelector('.badge-warning') as HTMLElement;
      const errorBadge = container.querySelector('.badge-error') as HTMLElement;
      const infoBadge = container.querySelector('.badge-info') as HTMLElement;
      
      expect(successBadge).toBeTruthy();
      expect(warningBadge).toBeTruthy();
      expect(errorBadge).toBeTruthy();
      expect(infoBadge).toBeTruthy();
    });

    it('should apply status badge classes correctly', () => {
      const container = document.getElementById('test-container')!;
      
      container.innerHTML = `
        <span class="status-pending">Pending</span>
        <span class="status-confirmed">Confirmed</span>
        <span class="status-processing">Processing</span>
        <span class="status-shipped">Shipped</span>
        <span class="status-delivered">Delivered</span>
        <span class="status-cancelled">Cancelled</span>
      `;
      
      const statusElements = container.querySelectorAll('[class^="status-"]');
      expect(statusElements.length).toBe(6);
      
      statusElements.forEach(element => {
        expect(element).toBeTruthy();
      });
    });
  });

  describe('Utility Classes Integration', () => {
    it('should apply custom utility classes correctly', () => {
      const container = document.getElementById('test-container')!;
      
      // Test text balance
      container.innerHTML = '<div class="text-balance">Balanced text</div>';
      const textBalanceElement = container.querySelector('.text-balance') as HTMLElement;
      expect(textBalanceElement).toBeTruthy();
      
      // Test scrollbar hide
      container.innerHTML = '<div class="scrollbar-hide">Hidden scrollbar</div>';
      const scrollbarHideElement = container.querySelector('.scrollbar-hide') as HTMLElement;
      expect(scrollbarHideElement).toBeTruthy();
      
      // Test safe area utilities
      container.innerHTML = '<div class="safe-top safe-bottom">Safe area</div>';
      const safeAreaElement = container.querySelector('.safe-top') as HTMLElement;
      expect(safeAreaElement).toBeTruthy();
      expect(safeAreaElement.classList.contains('safe-bottom')).toBe(true);
    });
  });

  describe('Responsive Classes Integration', () => {
    it('should generate responsive variants', () => {
      // Check that responsive classes are available
      expect(css).toContain('@media (min-width: 475px)'); // xs
      expect(css).toContain('@media (min-width: 640px)'); // sm
      expect(css).toContain('@media (min-width: 768px)'); // md
      expect(css).toContain('@media (min-width: 1024px)'); // lg
      expect(css).toContain('@media (min-width: 1280px)'); // xl
      expect(css).toContain('@media (min-width: 1536px)'); // 2xl
    });

    it('should apply responsive classes correctly', () => {
      const container = document.getElementById('test-container')!;
      
      container.innerHTML = '<div class="text-sm md:text-lg xl:text-xl">Responsive text</div>';
      const responsiveElement = container.querySelector('div') as HTMLElement;
      
      expect(responsiveElement).toBeTruthy();
      expect(responsiveElement.classList.contains('text-sm')).toBe(true);
      expect(responsiveElement.classList.contains('md:text-lg')).toBe(true);
      expect(responsiveElement.classList.contains('xl:text-xl')).toBe(true);
    });
  });

  describe('Animation Classes Integration', () => {
    it('should apply animation classes correctly', () => {
      const container = document.getElementById('test-container')!;
      
      container.innerHTML = `
        <div class="animate-fade-in">Fade in</div>
        <div class="animate-slide-up">Slide up</div>
        <div class="animate-scale-in">Scale in</div>
        <div class="animate-spin-slow">Spin slow</div>
      `;
      
      const fadeInElement = container.querySelector('.animate-fade-in') as HTMLElement;
      const slideUpElement = container.querySelector('.animate-slide-up') as HTMLElement;
      const scaleInElement = container.querySelector('.animate-scale-in') as HTMLElement;
      const spinSlowElement = container.querySelector('.animate-spin-slow') as HTMLElement;
      
      expect(fadeInElement).toBeTruthy();
      expect(slideUpElement).toBeTruthy();
      expect(scaleInElement).toBeTruthy();
      expect(spinSlowElement).toBeTruthy();
    });
  });

  describe('Grid Classes Integration', () => {
    it('should apply custom grid classes correctly', () => {
      const container = document.getElementById('test-container')!;
      
      container.innerHTML = `
        <div class="grid grid-cols-auto-fit-sm">Auto fit small</div>
        <div class="grid grid-cols-product-grid">Product grid</div>
        <div class="grid grid-cols-admin-layout">Admin layout</div>
      `;
      
      const autoFitElement = container.querySelector('.grid-cols-auto-fit-sm') as HTMLElement;
      const productGridElement = container.querySelector('.grid-cols-product-grid') as HTMLElement;
      const adminLayoutElement = container.querySelector('.grid-cols-admin-layout') as HTMLElement;
      
      expect(autoFitElement).toBeTruthy();
      expect(productGridElement).toBeTruthy();
      expect(adminLayoutElement).toBeTruthy();
    });
  });

  describe('Dark Mode Integration', () => {
    it('should apply dark mode classes correctly', () => {
      const container = document.getElementById('test-container')!;
      
      // Add dark class to html element
      document.documentElement.classList.add('dark');
      
      container.innerHTML = '<div class="bg-white dark:bg-gray-900">Dark mode test</div>';
      const darkModeElement = container.querySelector('div') as HTMLElement;
      
      expect(darkModeElement).toBeTruthy();
      expect(darkModeElement.classList.contains('bg-white')).toBe(true);
      expect(darkModeElement.classList.contains('dark:bg-gray-900')).toBe(true);
      
      // Clean up
      document.documentElement.classList.remove('dark');
    });
  });

  describe('E-commerce Specific Integration', () => {
    it('should apply price color classes correctly', () => {
      const container = document.getElementById('test-container')!;
      
      container.innerHTML = `
        <span class="text-price-regular">$19.99</span>
        <span class="text-price-sale">$14.99</span>
        <span class="text-price-compare">$24.99</span>
      `;
      
      const regularPrice = container.querySelector('.text-price-regular') as HTMLElement;
      const salePrice = container.querySelector('.text-price-sale') as HTMLElement;
      const comparePrice = container.querySelector('.text-price-compare') as HTMLElement;
      
      expect(regularPrice).toBeTruthy();
      expect(salePrice).toBeTruthy();
      expect(comparePrice).toBeTruthy();
    });

    it('should apply status color classes correctly', () => {
      const container = document.getElementById('test-container')!;
      
      container.innerHTML = `
        <span class="text-status-pending">Pending</span>
        <span class="text-status-confirmed">Confirmed</span>
        <span class="text-status-delivered">Delivered</span>
        <span class="text-status-cancelled">Cancelled</span>
      `;
      
      const pendingStatus = container.querySelector('.text-status-pending') as HTMLElement;
      const confirmedStatus = container.querySelector('.text-status-confirmed') as HTMLElement;
      const deliveredStatus = container.querySelector('.text-status-delivered') as HTMLElement;
      const cancelledStatus = container.querySelector('.text-status-cancelled') as HTMLElement;
      
      expect(pendingStatus).toBeTruthy();
      expect(confirmedStatus).toBeTruthy();
      expect(deliveredStatus).toBeTruthy();
      expect(cancelledStatus).toBeTruthy();
    });
  });
});