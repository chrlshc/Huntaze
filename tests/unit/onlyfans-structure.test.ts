import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { join } from 'path';

describe('🏗️ OnlyFans Structure - Validation Complète', () => {
  const root = process.cwd();

  describe('📁 Dossiers API', () => {
    it('should have API auth route', () => {
      expect(existsSync(join(root, 'app/api/auth/onlyfans'))).toBe(true);
    });

    it('should have API integrations route', () => {
      expect(existsSync(join(root, 'app/api/integrations/onlyfans'))).toBe(true);
    });

    it('should have API platforms route', () => {
      expect(existsSync(join(root, 'app/api/platforms/onlyfans'))).toBe(true);
    });

    it('should have API waitlist route', () => {
      expect(existsSync(join(root, 'app/api/waitlist/onlyfans'))).toBe(true);
    });
  });

  describe('📱 Pages Frontend', () => {
    it('should have dashboard page', () => {
      expect(existsSync(join(root, 'app/dashboard/onlyfans/page.tsx'))).toBe(true);
    });

    it('should have features page', () => {
      expect(existsSync(join(root, 'app/features/onlyfans/page.tsx'))).toBe(true);
    });

    it('should have messages page', () => {
      expect(existsSync(join(root, 'app/messages/onlyfans/page.tsx'))).toBe(true);
    });

    it('should have connect page', () => {
      expect(existsSync(join(root, 'app/platforms/connect/onlyfans/page.tsx'))).toBe(true);
    });

    it('should have import page', () => {
      expect(existsSync(join(root, 'app/platforms/import/onlyfans/page.tsx'))).toBe(true);
    });
  });

  describe('🔧 Services & Types', () => {
    it('should have OnlyFans integration service', () => {
      expect(existsSync(join(root, 'lib/integrations/onlyfans.ts'))).toBe(true);
    });

    it('should have OnlyFans TypeScript types', () => {
      expect(existsSync(join(root, 'src/lib/types/onlyfans.ts'))).toBe(true);
    });

    it('should have OnlyFans 2025 presets', () => {
      expect(existsSync(join(root, 'src/presets/onlyfans-2025.ts'))).toBe(true);
    });
  });

  describe('🧪 Tests', () => {
    it('should have compliance tests', () => {
      expect(existsSync(join(root, 'tests/unit/compliance-onlyfans.test.ts'))).toBe(true);
    });

    it('should have implementation validation tests', () => {
      expect(existsSync(join(root, 'tests/unit/onlyfans-implementation-status-validation.test.ts'))).toBe(true);
    });
  });

  describe('📊 Statistiques', () => {
    it('should have at least 10 dossiers OnlyFans', () => {
      const dirs = [
        'app/api/auth/onlyfans',
        'app/api/integrations/onlyfans',
        'app/api/platforms/onlyfans',
        'app/api/waitlist/onlyfans',
        'app/dashboard/onlyfans',
        'app/features/onlyfans',
        'app/messages/onlyfans',
        'app/platforms/connect/onlyfans',
        'app/platforms/import/onlyfans',
        'pages/onlyfans',
      ];
      const existing = dirs.filter(d => existsSync(join(root, d)));
      expect(existing.length).toBeGreaterThanOrEqual(10);
    });

    it('should have at least 15 fichiers TypeScript OnlyFans', () => {
      const files = [
        'app/api/auth/onlyfans/route.ts',
        'app/api/integrations/onlyfans/status/route.ts',
        'app/api/platforms/onlyfans/connect/route.ts',
        'app/api/waitlist/onlyfans/route.ts',
        'app/dashboard/onlyfans/page.tsx',
        'app/features/onlyfans/page.tsx',
        'app/messages/onlyfans/page.tsx',
        'app/platforms/connect/onlyfans-placeholder.tsx',
        'app/platforms/connect/onlyfans/page.tsx',
        'app/platforms/import/onlyfans/page.tsx',
        'lib/integrations/onlyfans.ts',
        'pages/onlyfans/index.tsx',
        'src/lib/types/onlyfans.ts',
        'src/presets/onlyfans-2025.ts',
        'tests/unit/compliance-onlyfans.test.ts',
        'tests/unit/onlyfans-implementation-status-validation.test.ts',
      ];
      const existing = files.filter(f => existsSync(join(root, f)));
      expect(existing.length).toBeGreaterThanOrEqual(15);
    });
  });
});
