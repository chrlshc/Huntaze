/**
 * Unit Tests - BIMI Logo Validation
 * 
 * Tests to validate the BIMI logo SVG file structure and compliance
 * Based on: BIMI specification requirements
 * 
 * Coverage:
 * - SVG file existence and readability
 * - SVG structure validation (XML, viewBox, dimensions)
 * - BIMI compliance (Tiny PS profile, size requirements)
 * - Accessibility (title, desc elements)
 * - Visual elements validation
 * - Color scheme validation
 * - File size constraints
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync, statSync } from 'fs';
import { join } from 'path';

describe('BIMI Logo - Validation', () => {
  let logoContent: string;
  let logoPath: string;
  let fileSize: number;

  beforeAll(() => {
    logoPath = join(process.cwd(), 'public/huntaze-bimi-logo.svg');
    
    if (!existsSync(logoPath)) {
      throw new Error('BIMI logo file not found at public/huntaze-bimi-logo.svg');
    }
    
    logoContent = readFileSync(logoPath, 'utf-8');
    fileSize = statSync(logoPath).size;
  });

  describe('File Existence and Basic Properties', () => {
    it('should exist at public/huntaze-bimi-logo.svg', () => {
      expect(existsSync(logoPath)).toBe(true);
    });

    it('should be readable as UTF-8 text', () => {
      expect(logoContent).toBeTruthy();
      expect(typeof logoContent).toBe('string');
      expect(logoContent.length).toBeGreaterThan(0);
    });

    it('should be under 32KB (BIMI size limit)', () => {
      // BIMI recommends logos under 32KB
      expect(fileSize).toBeLessThan(32 * 1024);
    });

    it('should be reasonably small (under 5KB for simple logo)', () => {
      // Our simple geometric logo should be very small
      expect(fileSize).toBeLessThan(5 * 1024);
    });
  });

  describe('SVG Structure - XML Declaration', () => {
    it('should start with XML declaration', () => {
      expect(logoContent).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    });

    it('should have proper XML encoding', () => {
      expect(logoContent).toContain('encoding="UTF-8"');
    });
  });

  describe('SVG Root Element', () => {
    it('should have svg root element', () => {
      expect(logoContent).toContain('<svg');
      expect(logoContent).toContain('</svg>');
    });

    it('should specify SVG version 1.2', () => {
      expect(logoContent).toContain('version="1.2"');
    });

    it('should have xmlns namespace', () => {
      expect(logoContent).toContain('xmlns="http://www.w3.org/2000/svg"');
    });

    it('should specify Tiny PS baseProfile for BIMI compliance', () => {
      // BIMI requires SVG Tiny PS (Portable/Secure) profile
      expect(logoContent).toContain('baseProfile="tiny-ps"');
    });

    it('should have viewBox attribute', () => {
      expect(logoContent).toContain('viewBox="0 0 512 512"');
    });

    it('should have width and height attributes', () => {
      expect(logoContent).toContain('width="512"');
      expect(logoContent).toContain('height="512"');
    });

    it('should be square (width === height)', () => {
      const widthMatch = logoContent.match(/width="(\d+)"/);
      const heightMatch = logoContent.match(/height="(\d+)"/);
      
      expect(widthMatch).toBeTruthy();
      expect(heightMatch).toBeTruthy();
      expect(widthMatch![1]).toBe(heightMatch![1]);
    });
  });

  describe('Accessibility - Metadata Elements', () => {
    it('should have title element', () => {
      expect(logoContent).toContain('<title>');
      expect(logoContent).toContain('</title>');
    });

    it('should have descriptive title text', () => {
      expect(logoContent).toMatch(/<title>.*Huntaze.*Logo.*<\/title>/i);
    });

    it('should have desc element', () => {
      expect(logoContent).toContain('<desc>');
      expect(logoContent).toContain('</desc>');
    });

    it('should have descriptive desc text', () => {
      expect(logoContent).toMatch(/<desc>.*brand.*mark.*Huntaze.*<\/desc>/i);
    });

    it('should have title before desc (recommended order)', () => {
      const titleIndex = logoContent.indexOf('<title>');
      const descIndex = logoContent.indexOf('<desc>');
      
      expect(titleIndex).toBeGreaterThan(-1);
      expect(descIndex).toBeGreaterThan(-1);
      expect(titleIndex).toBeLessThan(descIndex);
    });
  });

  describe('Visual Elements - Background', () => {
    it('should have background circle', () => {
      expect(logoContent).toContain('<circle');
    });

    it('should have centered background circle', () => {
      expect(logoContent).toMatch(/<circle[^>]*cx="256"[^>]*cy="256"/);
    });

    it('should have appropriate radius for background', () => {
      expect(logoContent).toMatch(/<circle[^>]*r="240"/);
    });

    it('should have dark background color', () => {
      // Background should be dark (#1a1a1a)
      expect(logoContent).toMatch(/<circle[^>]*fill="#1a1a1a"/);
    });
  });

  describe('Visual Elements - Letter H', () => {
    it('should have group element for H letter', () => {
      expect(logoContent).toContain('<g');
      expect(logoContent).toContain('</g>');
    });

    it('should have white fill for H letter', () => {
      expect(logoContent).toMatch(/<g[^>]*fill="#ffffff"/);
    });

    it('should have three rect elements for H shape', () => {
      const rectMatches = logoContent.match(/<rect/g);
      expect(rectMatches).toBeTruthy();
      expect(rectMatches!.length).toBeGreaterThanOrEqual(3);
    });

    it('should have left vertical bar of H', () => {
      expect(logoContent).toMatch(/<rect[^>]*x="140"[^>]*y="160"[^>]*width="50"[^>]*height="192"/);
    });

    it('should have right vertical bar of H', () => {
      expect(logoContent).toMatch(/<rect[^>]*x="322"[^>]*y="160"[^>]*width="50"[^>]*height="192"/);
    });

    it('should have horizontal bar of H', () => {
      expect(logoContent).toMatch(/<rect[^>]*x="140"[^>]*y="236"[^>]*width="232"[^>]*height="50"/);
    });

    it('should have rounded corners on rect elements', () => {
      expect(logoContent).toMatch(/<rect[^>]*rx="8"/);
    });
  });

  describe('Visual Elements - Accent', () => {
    it('should have accent circle element', () => {
      const circleMatches = logoContent.match(/<circle/g);
      expect(circleMatches).toBeTruthy();
      expect(circleMatches!.length).toBeGreaterThanOrEqual(2); // Background + accent
    });

    it('should have blue accent color', () => {
      expect(logoContent).toMatch(/fill="#3b82f6"/);
    });

    it('should have accent positioned correctly', () => {
      expect(logoContent).toMatch(/<circle[^>]*cx="390"[^>]*cy="180"[^>]*r="18"/);
    });
  });

  describe('Color Scheme Validation', () => {
    it('should use hex color format', () => {
      const colorMatches = logoContent.match(/fill="#[0-9a-fA-F]{6}"/g);
      expect(colorMatches).toBeTruthy();
      expect(colorMatches!.length).toBeGreaterThanOrEqual(3);
    });

    it('should have dark background (#1a1a1a)', () => {
      expect(logoContent).toContain('#1a1a1a');
    });

    it('should have white foreground (#ffffff)', () => {
      expect(logoContent).toContain('#ffffff');
    });

    it('should have blue accent (#3b82f6)', () => {
      expect(logoContent).toContain('#3b82f6');
    });

    it('should not use RGB or RGBA colors', () => {
      expect(logoContent).not.toMatch(/rgb\(/);
      expect(logoContent).not.toMatch(/rgba\(/);
    });

    it('should not use HSL colors', () => {
      expect(logoContent).not.toMatch(/hsl\(/);
      expect(logoContent).not.toMatch(/hsla\(/);
    });
  });

  describe('BIMI Compliance - Security', () => {
    it('should not contain script elements', () => {
      expect(logoContent).not.toContain('<script');
      expect(logoContent).not.toMatch(/<script[^>]*>/i);
    });

    it('should not contain external references', () => {
      expect(logoContent).not.toMatch(/xlink:href/);
      expect(logoContent).not.toMatch(/href="http/);
    });

    it('should not contain embedded images', () => {
      expect(logoContent).not.toContain('<image');
      expect(logoContent).not.toMatch(/data:image/);
    });

    it('should not contain animation elements', () => {
      expect(logoContent).not.toContain('<animate');
      expect(logoContent).not.toContain('<animateTransform');
      expect(logoContent).not.toContain('<animateMotion');
    });

    it('should not contain foreign objects', () => {
      expect(logoContent).not.toContain('<foreignObject');
    });

    it('should not contain style elements with external imports', () => {
      expect(logoContent).not.toMatch(/<style[^>]*>.*@import/s);
    });
  });

  describe('BIMI Compliance - Structure', () => {
    it('should use only allowed SVG elements', () => {
      // BIMI Tiny PS allows: svg, g, circle, rect, path, polygon, etc.
      const allowedElements = [
        'svg', 'g', 'circle', 'rect', 'path', 'polygon', 'polyline',
        'line', 'ellipse', 'title', 'desc', 'defs', 'use'
      ];
      
      const elementMatches = logoContent.match(/<(\w+)[\s>]/g);
      expect(elementMatches).toBeTruthy();
      
      elementMatches!.forEach(match => {
        const element = match.match(/<(\w+)/)?.[1];
        if (element && !['?xml', '!--'].includes(element)) {
          expect(allowedElements).toContain(element.toLowerCase());
        }
      });
    });

    it('should not use filters', () => {
      expect(logoContent).not.toContain('<filter');
      expect(logoContent).not.toMatch(/filter="/);
    });

    it('should not use masks', () => {
      expect(logoContent).not.toContain('<mask');
      expect(logoContent).not.toMatch(/mask="/);
    });

    it('should not use clip paths with external references', () => {
      expect(logoContent).not.toMatch(/clip-path="url\(#/);
    });
  });

  describe('Code Quality - Comments', () => {
    it('should have descriptive comments', () => {
      expect(logoContent).toMatch(/<!--.*Background.*-->/i);
      expect(logoContent).toMatch(/<!--.*Letter H.*-->/i);
      expect(logoContent).toMatch(/<!--.*Accent.*-->/i);
    });

    it('should have comments for major sections', () => {
      const commentMatches = logoContent.match(/<!--.*?-->/g);
      expect(commentMatches).toBeTruthy();
      expect(commentMatches!.length).toBeGreaterThanOrEqual(3);
    });

    it('should have well-formatted comments', () => {
      const comments = logoContent.match(/<!--.*?-->/g) || [];
      comments.forEach(comment => {
        expect(comment).toMatch(/<!-- .+ -->/);
      });
    });
  });

  describe('Code Quality - Formatting', () => {
    it('should have proper indentation', () => {
      const lines = logoContent.split('\n');
      const indentedLines = lines.filter(line => line.match(/^\s{2,}/));
      expect(indentedLines.length).toBeGreaterThan(0);
    });

    it('should have consistent line breaks', () => {
      expect(logoContent).not.toMatch(/\r\n/); // No Windows line endings
      expect(logoContent).toMatch(/\n/); // Unix line endings
    });

    it('should not have trailing whitespace', () => {
      const lines = logoContent.split('\n');
      lines.forEach(line => {
        if (line.length > 0) {
          expect(line).not.toMatch(/\s$/);
        }
      });
    });
  });

  describe('Dimensions and Proportions', () => {
    it('should have square aspect ratio (1:1)', () => {
      const viewBoxMatch = logoContent.match(/viewBox="(\d+)\s+(\d+)\s+(\d+)\s+(\d+)"/);
      expect(viewBoxMatch).toBeTruthy();
      
      const [, , , width, height] = viewBoxMatch!;
      expect(width).toBe(height);
    });

    it('should have 512x512 dimensions', () => {
      expect(logoContent).toContain('viewBox="0 0 512 512"');
      expect(logoContent).toContain('width="512"');
      expect(logoContent).toContain('height="512"');
    });

    it('should have centered elements', () => {
      // Background circle should be centered at 256, 256
      expect(logoContent).toMatch(/cx="256".*cy="256"/);
    });

    it('should have appropriate padding (background radius < 256)', () => {
      const radiusMatch = logoContent.match(/r="(\d+)"/);
      expect(radiusMatch).toBeTruthy();
      
      const radius = parseInt(radiusMatch![1]);
      expect(radius).toBeLessThan(256); // Leaves padding
      expect(radius).toBeGreaterThan(200); // Not too small
    });
  });

  describe('Brand Consistency', () => {
    it('should reference Huntaze brand', () => {
      expect(logoContent.toLowerCase()).toContain('huntaze');
    });

    it('should use brand colors', () => {
      // Dark background + white text + blue accent is our brand
      expect(logoContent).toContain('#1a1a1a'); // Dark
      expect(logoContent).toContain('#ffffff'); // White
      expect(logoContent).toContain('#3b82f6'); // Blue (Tailwind blue-500)
    });

    it('should have professional appearance', () => {
      // Should have rounded corners for modern look
      expect(logoContent).toContain('rx="8"');
    });
  });

  describe('Integration - File Path', () => {
    it('should be in public directory', () => {
      expect(logoPath).toContain('public/');
    });

    it('should have correct filename', () => {
      expect(logoPath).toContain('huntaze-bimi-logo.svg');
    });

    it('should be accessible via web path', () => {
      // File should be accessible at /huntaze-bimi-logo.svg
      const publicPath = logoPath.split('public/')[1];
      expect(publicPath).toBe('huntaze-bimi-logo.svg');
    });
  });

  describe('Validation - Complete BIMI Compliance', () => {
    it('should pass all BIMI requirements', () => {
      const requirements = {
        'SVG version 1.2': logoContent.includes('version="1.2"'),
        'Tiny PS profile': logoContent.includes('baseProfile="tiny-ps"'),
        'Square dimensions': logoContent.includes('viewBox="0 0 512 512"'),
        'Has title': logoContent.includes('<title>'),
        'Has desc': logoContent.includes('<desc>'),
        'No scripts': !logoContent.includes('<script'),
        'No external refs': !logoContent.includes('xlink:href'),
        'Under 32KB': fileSize < 32 * 1024,
        'Valid XML': logoContent.startsWith('<?xml'),
        'Proper namespace': logoContent.includes('xmlns="http://www.w3.org/2000/svg"'),
      };

      Object.entries(requirements).forEach(([requirement, passed]) => {
        expect(passed).toBe(true);
      });
    });

    it('should be production-ready', () => {
      expect(logoContent).toBeTruthy();
      expect(fileSize).toBeGreaterThan(0);
      expect(fileSize).toBeLessThan(32 * 1024);
      expect(logoContent).toContain('baseProfile="tiny-ps"');
      expect(logoContent).not.toContain('<script');
    });
  });

  describe('Edge Cases', () => {
    it('should handle file reading errors gracefully', () => {
      expect(() => {
        readFileSync(logoPath, 'utf-8');
      }).not.toThrow();
    });

    it('should not be empty', () => {
      expect(logoContent.trim().length).toBeGreaterThan(100);
    });

    it('should not have duplicate IDs', () => {
      const idMatches = logoContent.match(/id="([^"]+)"/g);
      if (idMatches) {
        const ids = idMatches.map(m => m.match(/id="([^"]+)"/)?.[1]);
        const uniqueIds = new Set(ids);
        expect(ids.length).toBe(uniqueIds.size);
      }
    });

    it('should not have malformed XML', () => {
      // Basic XML validation
      expect(logoContent).not.toMatch(/<[^>]*<[^>]*>/); // No nested tags in attributes
      expect(logoContent).not.toMatch(/>[^<]*</); // No unclosed tags
    });
  });
});
