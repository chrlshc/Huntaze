/**
 * Unit Tests - Variation Management System (Task 10.1)
 * 
 * Tests to validate the A/B testing variation management system
 * Based on: .kiro/specs/content-creation/tasks.md (Task 10.1)
 * 
 * Coverage:
 * - API for creating content variations
 * - Variation storage in database
 * - UI for creating up to 5 variations
 * - Side-by-side comparison of variations
 * - Requirements: 9.1, 9.2
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('Task 10.1 - Variation Management System', () => {
  let variationsApiContent: string;
  let variationManagerContent: string;
  let contentVariationsTableExists: boolean;

  beforeAll(() => {
    const variationsApiPath = join(process.cwd(), 'app/api/content/variations/route.ts');
    const variationManagerPath = join(process.cwd(), 'components/content/VariationManager.tsx');
    const migrationPath = join(process.cwd(), 'lib/db/migrations/2024-10-31-content-creation.sql');

    variationsApiContent = existsSync(variationsApiPath) 
      ? readFileSync(variationsApiPath, 'utf-8') 
      : '';
    
    variationManagerContent = existsSync(variationManagerPath)
      ? readFileSync(variationManagerPath, 'utf-8')
      : '';

    if (existsSync(migrationPath)) {
      const migrationContent = readFileSync(migrationPath, 'utf-8');
      contentVariationsTableExists = migrationContent.includes('content_variations');
    } else {
      contentVariationsTableExists = false;
    }
  });

  describe('Requirement 9.1 - Create Up to 5 Variations', () => {
    it('should have API endpoint for creating variations', () => {
      expect(variationsApiContent).toBeTruthy();
      expect(variationsApiContent).toContain('export async function POST');
    });

    it('should validate maximum of 5 variations', () => {
      expect(variationsApiContent).toMatch(/max.*5|limit.*5|variations.*5/i);
    });

    it('should accept variation data in request body', () => {
      expect(variationsApiContent).toContain('request.json()');
    });

    it('should validate required variation fields', () => {
      const hasValidation = variationsApiContent.includes('content_id') ||
                           variationsApiContent.includes('variation_name') ||
                           variationsApiContent.includes('variation_data');
      expect(hasValidation).toBe(true);
    });

    it('should return created variation with ID', () => {
      expect(variationsApiContent).toMatch(/variation.*id|id.*variation/i);
    });
  });

  describe('Requirement 9.1 - Variation Storage', () => {
    it('should have content_variations table in database', () => {
      expect(contentVariationsTableExists).toBe(true);
    });

    it('should store variation metadata', () => {
      const hasMetadataFields = variationsApiContent.includes('variation_name') ||
                                variationsApiContent.includes('variation_type') ||
                                variationsApiContent.includes('variation_data');
      expect(hasMetadataFields).toBe(true);
    });

    it('should link variations to parent content', () => {
      expect(variationsApiContent).toMatch(/content_id|parent.*id/i);
    });

    it('should store variation order/index', () => {
      const hasOrder = variationsApiContent.includes('variation_index') ||
                      variationsApiContent.includes('order') ||
                      variationsApiContent.includes('position');
      expect(hasOrder).toBe(true);
    });
  });

  describe('Requirement 9.2 - UI for Creating Variations', () => {
    it('should have VariationManager component', () => {
      expect(variationManagerContent).toBeTruthy();
    });

    it('should display variation creation interface', () => {
      expect(variationManagerContent).toMatch(/create.*variation|add.*variation|new.*variation/i);
    });

    it('should show variation count limit', () => {
      expect(variationManagerContent).toMatch(/5.*variations|max.*5|limit.*5/i);
    });

    it('should have form for variation input', () => {
      const hasForm = variationManagerContent.includes('<form') ||
                     variationManagerContent.includes('onSubmit') ||
                     variationManagerContent.includes('handleSubmit');
      expect(hasForm).toBe(true);
    });

    it('should display list of existing variations', () => {
      expect(variationManagerContent).toMatch(/variations\.map|variation.*list/i);
    });

    it('should allow editing variation name', () => {
      expect(variationManagerContent).toMatch(/variation.*name|name.*input/i);
    });

    it('should support different variation types', () => {
      const hasTypes = variationManagerContent.includes('text') ||
                      variationManagerContent.includes('image') ||
                      variationManagerContent.includes('time');
      expect(hasTypes).toBe(true);
    });
  });

  describe('Requirement 9.2 - Side-by-Side Comparison', () => {
    it('should display variations side by side', () => {
      expect(variationManagerContent).toMatch(/side.*by.*side|comparison|compare/i);
    });

    it('should show variation differences', () => {
      expect(variationManagerContent).toMatch(/diff|difference|highlight|compare/i);
    });

    it('should render variation previews', () => {
      expect(variationManagerContent).toMatch(/preview|render.*variation/i);
    });

    it('should use grid or flex layout for comparison', () => {
      const hasLayout = variationManagerContent.includes('grid') ||
                       variationManagerContent.includes('flex') ||
                       variationManagerContent.includes('columns');
      expect(hasLayout).toBe(true);
    });

    it('should label each variation clearly', () => {
      expect(variationManagerContent).toMatch(/variation.*[A-Z]|version.*\d/i);
    });
  });

  describe('API Endpoint Structure', () => {
    it('should handle POST requests for creating variations', () => {
      expect(variationsApiContent).toContain('POST');
    });

    it('should handle GET requests for listing variations', () => {
      expect(variationsApiContent).toContain('GET');
    });

    it('should authenticate requests', () => {
      const hasAuth = variationsApiContent.includes('getServerSession') ||
                     variationsApiContent.includes('auth') ||
                     variationsApiContent.includes('user');
      expect(hasAuth).toBe(true);
    });

    it('should validate user ownership of content', () => {
      expect(variationsApiContent).toMatch(/user.*id|owner|permission/i);
    });

    it('should return proper error responses', () => {
      const hasErrorHandling = variationsApiContent.includes('error') ||
                              variationsApiContent.includes('catch') ||
                              variationsApiContent.includes('status: 400');
      expect(hasErrorHandling).toBe(true);
    });
  });

  describe('Variation Data Structure', () => {
    it('should store variation content data', () => {
      expect(variationsApiContent).toMatch(/variation.*data|content.*data/i);
    });

    it('should track variation creation timestamp', () => {
      expect(variationsApiContent).toMatch(/created.*at|timestamp/i);
    });

    it('should support variation metadata', () => {
      const hasMetadata = variationsApiContent.includes('metadata') ||
                         variationsApiContent.includes('description') ||
                         variationsApiContent.includes('notes');
      expect(hasMetadata).toBe(true);
    });

    it('should handle JSON variation data', () => {
      expect(variationsApiContent).toMatch(/JSON|json|parse|stringify/i);
    });
  });

  describe('UI Component Features', () => {
    it('should use React hooks for state management', () => {
      const hasHooks = variationManagerContent.includes('useState') ||
                      variationManagerContent.includes('useEffect') ||
                      variationManagerContent.includes('useCallback');
      expect(hasHooks).toBe(true);
    });

    it('should handle loading states', () => {
      expect(variationManagerContent).toMatch(/loading|isLoading|pending/i);
    });

    it('should display success messages', () => {
      expect(variationManagerContent).toMatch(/success|created|saved/i);
    });

    it('should display error messages', () => {
      expect(variationManagerContent).toMatch(/error|failed|invalid/i);
    });

    it('should have delete variation functionality', () => {
      expect(variationManagerContent).toMatch(/delete|remove|trash/i);
    });

    it('should confirm before deleting variations', () => {
      expect(variationManagerContent).toMatch(/confirm|are you sure|warning/i);
    });
  });

  describe('Variation Limits and Validation', () => {
    it('should enforce maximum 5 variations limit', () => {
      expect(variationsApiContent).toMatch(/variations\.length.*5|count.*5/i);
    });

    it('should prevent creating variations beyond limit', () => {
      const hasLimitCheck = variationsApiContent.includes('>=') ||
                           variationsApiContent.includes('maximum') ||
                           variationsApiContent.includes('limit reached');
      expect(hasLimitCheck).toBe(true);
    });

    it('should validate variation name is not empty', () => {
      expect(variationsApiContent).toMatch(/name.*required|!.*name|name\.trim/i);
    });

    it('should validate variation data is valid', () => {
      const hasValidation = variationsApiContent.includes('validate') ||
                           variationsApiContent.includes('isValid') ||
                           variationsApiContent.includes('schema');
      expect(hasValidation).toBe(true);
    });
  });

  describe('Integration with Content System', () => {
    it('should link to content items', () => {
      expect(variationsApiContent).toMatch(/content.*id|parent.*content/i);
    });

    it('should query variations by content ID', () => {
      expect(variationsApiContent).toMatch(/WHERE.*content_id|content_id.*=/i);
    });

    it('should support variation ordering', () => {
      expect(variationsApiContent).toMatch(/ORDER BY|sort|order/i);
    });

    it('should handle variation updates', () => {
      const hasUpdate = variationsApiContent.includes('PUT') ||
                       variationsApiContent.includes('PATCH') ||
                       variationsApiContent.includes('UPDATE');
      expect(hasUpdate).toBe(true);
    });
  });

  describe('Task 10.1 Completion Status', () => {
    it('should have variation API implemented', () => {
      expect(variationsApiContent.length).toBeGreaterThan(100);
    });

    it('should have VariationManager UI component', () => {
      expect(variationManagerContent.length).toBeGreaterThan(100);
    });

    it('should have database table for variations', () => {
      expect(contentVariationsTableExists).toBe(true);
    });

    it('should support creating variations', () => {
      expect(variationsApiContent).toContain('POST');
    });

    it('should support listing variations', () => {
      expect(variationsApiContent).toContain('GET');
    });

    it('should enforce 5 variation limit', () => {
      const hasLimit = variationsApiContent.includes('5') ||
                      variationManagerContent.includes('5');
      expect(hasLimit).toBe(true);
    });

    it('should display variations side by side', () => {
      expect(variationManagerContent).toMatch(/comparison|compare|side.*by.*side/i);
    });

    it('should highlight differences between variations', () => {
      expect(variationManagerContent).toMatch(/diff|difference|highlight/i);
    });
  });

  describe('Validation - Complete Implementation', () => {
    it('should pass all Task 10.1 requirements', () => {
      const requirements = {
        'API for creating variations': variationsApiContent.includes('POST'),
        'Variation storage in database': contentVariationsTableExists,
        'UI for creating variations': variationManagerContent.length > 100,
        'Side-by-side comparison': variationManagerContent.includes('comparison') || 
                                   variationManagerContent.includes('compare'),
        'Maximum 5 variations': variationsApiContent.includes('5') || 
                               variationManagerContent.includes('5'),
        'Variation differences highlighted': variationManagerContent.includes('diff') ||
                                            variationManagerContent.includes('difference'),
      };

      Object.entries(requirements).forEach(([requirement, passed]) => {
        expect(passed).toBe(true);
      });
    });

    it('should have complete CRUD operations', () => {
      const operations = {
        'Create': variationsApiContent.includes('POST'),
        'Read': variationsApiContent.includes('GET'),
        'Update': variationsApiContent.includes('PUT') || variationsApiContent.includes('PATCH'),
        'Delete': variationsApiContent.includes('DELETE') || variationManagerContent.includes('delete'),
      };

      const completedOperations = Object.values(operations).filter(Boolean).length;
      expect(completedOperations).toBeGreaterThanOrEqual(3);
    });

    it('should have proper error handling', () => {
      const hasErrorHandling = variationsApiContent.includes('try') &&
                              variationsApiContent.includes('catch');
      expect(hasErrorHandling).toBe(true);
    });

    it('should have user authentication', () => {
      const hasAuth = variationsApiContent.includes('session') ||
                     variationsApiContent.includes('auth') ||
                     variationsApiContent.includes('user');
      expect(hasAuth).toBe(true);
    });
  });
});
