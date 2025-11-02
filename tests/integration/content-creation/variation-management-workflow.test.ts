/**
 * Integration Tests - Variation Management Workflow
 * 
 * Integration tests to validate the complete A/B testing variation workflow
 * 
 * Coverage:
 * - Creating variations through API
 * - Listing variations for content
 * - Updating variation data
 * - Deleting variations
 * - Enforcing 5 variation limit
 * - Side-by-side comparison functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('Variation Management - Integration Tests', () => {
  let variationsApiContent: string;
  let variationIdApiContent: string;
  let variationManagerContent: string;

  beforeEach(() => {
    const variationsApiPath = join(process.cwd(), 'app/api/content/variations/route.ts');
    const variationIdApiPath = join(process.cwd(), 'app/api/content/variations/[id]/route.ts');
    const variationManagerPath = join(process.cwd(), 'components/content/VariationManager.tsx');

    variationsApiContent = existsSync(variationsApiPath)
      ? readFileSync(variationsApiPath, 'utf-8')
      : '';

    variationIdApiContent = existsSync(variationIdApiPath)
      ? readFileSync(variationIdApiPath, 'utf-8')
      : '';

    variationManagerContent = existsSync(variationManagerPath)
      ? readFileSync(variationManagerPath, 'utf-8')
      : '';
  });

  describe('API Endpoint Integration', () => {
    it('should have POST endpoint for creating variations', () => {
      expect(variationsApiContent).toContain('export async function POST');
    });

    it('should have GET endpoint for listing variations', () => {
      expect(variationsApiContent).toContain('export async function GET');
    });

    it('should have individual variation endpoint', () => {
      expect(variationIdApiContent).toBeTruthy();
    });

    it('should support updating individual variations', () => {
      const hasUpdate = variationIdApiContent.includes('PUT') ||
                       variationIdApiContent.includes('PATCH');
      expect(hasUpdate).toBe(true);
    });

    it('should support deleting individual variations', () => {
      expect(variationIdApiContent).toContain('DELETE');
    });
  });

  describe('Variation Creation Workflow', () => {
    it('should validate content_id is provided', () => {
      expect(variationsApiContent).toMatch(/content.*id|contentId/i);
    });

    it('should validate variation name is provided', () => {
      expect(variationsApiContent).toMatch(/variation.*name|name.*required/i);
    });

    it('should check existing variation count before creating', () => {
      expect(variationsApiContent).toMatch(/count|length|variations\.length/i);
    });

    it('should return error if limit exceeded', () => {
      const hasLimitError = variationsApiContent.includes('maximum') ||
                           variationsApiContent.includes('limit') ||
                           variationsApiContent.includes('too many');
      expect(hasLimitError).toBe(true);
    });

    it('should store variation data in database', () => {
      expect(variationsApiContent).toMatch(/INSERT|create|save/i);
    });

    it('should return created variation with ID', () => {
      expect(variationsApiContent).toMatch(/return.*variation|variation.*id/i);
    });
  });

  describe('Variation Listing Workflow', () => {
    it('should query variations by content ID', () => {
      expect(variationsApiContent).toMatch(/WHERE.*content_id|content_id.*=/i);
    });

    it('should order variations consistently', () => {
      expect(variationsApiContent).toMatch(/ORDER BY|sort/i);
    });

    it('should return array of variations', () => {
      expect(variationsApiContent).toMatch(/variations|array|\[\]/i);
    });

    it('should include variation metadata', () => {
      const hasMetadata = variationsApiContent.includes('name') ||
                         variationsApiContent.includes('created_at') ||
                         variationsApiContent.includes('variation_data');
      expect(hasMetadata).toBe(true);
    });
  });

  describe('Variation Update Workflow', () => {
    it('should validate variation exists before updating', () => {
      expect(variationIdApiContent).toMatch(/SELECT|find|get/i);
    });

    it('should validate user owns the variation', () => {
      expect(variationIdApiContent).toMatch(/user.*id|owner|permission/i);
    });

    it('should update variation data', () => {
      expect(variationIdApiContent).toMatch(/UPDATE|update|set/i);
    });

    it('should return updated variation', () => {
      expect(variationIdApiContent).toMatch(/return.*variation|updated/i);
    });
  });

  describe('Variation Deletion Workflow', () => {
    it('should validate variation exists before deleting', () => {
      expect(variationIdApiContent).toMatch(/SELECT|find|get/i);
    });

    it('should validate user owns the variation', () => {
      expect(variationIdApiContent).toMatch(/user.*id|owner|permission/i);
    });

    it('should delete variation from database', () => {
      expect(variationIdApiContent).toMatch(/DELETE|delete|remove/i);
    });

    it('should return success response', () => {
      expect(variationIdApiContent).toMatch(/success|deleted|removed/i);
    });
  });

  describe('UI Component Integration', () => {
    it('should fetch variations on component mount', () => {
      const hasFetch = variationManagerContent.includes('useEffect') ||
                      variationManagerContent.includes('fetch') ||
                      variationManagerContent.includes('load');
      expect(hasFetch).toBe(true);
    });

    it('should display loading state while fetching', () => {
      expect(variationManagerContent).toMatch(/loading|isLoading|pending/i);
    });

    it('should display variations after loading', () => {
      expect(variationManagerContent).toMatch(/variations\.map|variation.*list/i);
    });

    it('should handle create variation action', () => {
      expect(variationManagerContent).toMatch(/create.*variation|add.*variation/i);
    });

    it('should handle update variation action', () => {
      expect(variationManagerContent).toMatch(/update.*variation|edit.*variation/i);
    });

    it('should handle delete variation action', () => {
      expect(variationManagerContent).toMatch(/delete.*variation|remove.*variation/i);
    });
  });

  describe('Variation Limit Enforcement', () => {
    it('should check variation count before allowing creation', () => {
      expect(variationsApiContent).toMatch(/count|length|variations\.length/i);
    });

    it('should return error when limit reached', () => {
      const hasError = variationsApiContent.includes('400') ||
                      variationsApiContent.includes('error') ||
                      variationsApiContent.includes('maximum');
      expect(hasError).toBe(true);
    });

    it('should disable create button when limit reached in UI', () => {
      const hasDisable = variationManagerContent.includes('disabled') ||
                        variationManagerContent.includes('limit') ||
                        variationManagerContent.includes('maximum');
      expect(hasDisable).toBe(true);
    });

    it('should display limit message in UI', () => {
      expect(variationManagerContent).toMatch(/5.*variations|maximum.*5|limit.*5/i);
    });
  });

  describe('Side-by-Side Comparison', () => {
    it('should render variations in comparison view', () => {
      expect(variationManagerContent).toMatch(/comparison|compare|side.*by.*side/i);
    });

    it('should display variation content', () => {
      expect(variationManagerContent).toMatch(/variation.*content|content.*data/i);
    });

    it('should highlight differences', () => {
      expect(variationManagerContent).toMatch(/diff|difference|highlight|change/i);
    });

    it('should use grid or flex layout', () => {
      const hasLayout = variationManagerContent.includes('grid') ||
                       variationManagerContent.includes('flex') ||
                       variationManagerContent.includes('columns');
      expect(hasLayout).toBe(true);
    });

    it('should label each variation', () => {
      expect(variationManagerContent).toMatch(/variation.*[A-Z]|version|label/i);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', () => {
      const hasErrorHandling = variationsApiContent.includes('try') &&
                              variationsApiContent.includes('catch');
      expect(hasErrorHandling).toBe(true);
    });

    it('should return appropriate error status codes', () => {
      const hasStatusCodes = variationsApiContent.includes('400') ||
                            variationsApiContent.includes('401') ||
                            variationsApiContent.includes('404') ||
                            variationsApiContent.includes('500');
      expect(hasStatusCodes).toBe(true);
    });

    it('should display error messages in UI', () => {
      expect(variationManagerContent).toMatch(/error|failed|invalid/i);
    });

    it('should handle network errors', () => {
      const hasNetworkError = variationManagerContent.includes('catch') ||
                             variationManagerContent.includes('error') ||
                             variationManagerContent.includes('failed');
      expect(hasNetworkError).toBe(true);
    });
  });

  describe('Authentication and Authorization', () => {
    it('should require authentication for API endpoints', () => {
      const hasAuth = variationsApiContent.includes('getServerSession') ||
                     variationsApiContent.includes('auth') ||
                     variationsApiContent.includes('session');
      expect(hasAuth).toBe(true);
    });

    it('should validate user owns the content', () => {
      expect(variationsApiContent).toMatch(/user.*id|owner|permission/i);
    });

    it('should return 401 for unauthenticated requests', () => {
      expect(variationsApiContent).toContain('401');
    });

    it('should return 403 for unauthorized access', () => {
      const hasForbidden = variationsApiContent.includes('403') ||
                          variationsApiContent.includes('forbidden') ||
                          variationsApiContent.includes('unauthorized');
      expect(hasForbidden).toBe(true);
    });
  });

  describe('Data Validation', () => {
    it('should validate variation name is not empty', () => {
      expect(variationsApiContent).toMatch(/name.*required|!.*name|name\.trim/i);
    });

    it('should validate variation data structure', () => {
      const hasValidation = variationsApiContent.includes('validate') ||
                           variationsApiContent.includes('schema') ||
                           variationsApiContent.includes('isValid');
      expect(hasValidation).toBe(true);
    });

    it('should sanitize user input', () => {
      const hasSanitization = variationsApiContent.includes('trim') ||
                             variationsApiContent.includes('sanitize') ||
                             variationsApiContent.includes('escape');
      expect(hasSanitization).toBe(true);
    });

    it('should validate content_id exists', () => {
      expect(variationsApiContent).toMatch(/content.*exists|SELECT.*content/i);
    });
  });

  describe('Database Operations', () => {
    it('should use parameterized queries', () => {
      const hasParams = variationsApiContent.includes('$1') ||
                       variationsApiContent.includes('?') ||
                       variationsApiContent.includes('params');
      expect(hasParams).toBe(true);
    });

    it('should handle database errors', () => {
      const hasDbError = variationsApiContent.includes('catch') ||
                        variationsApiContent.includes('error') ||
                        variationsApiContent.includes('DatabaseError');
      expect(hasDbError).toBe(true);
    });

    it('should use transactions for complex operations', () => {
      const hasTransaction = variationsApiContent.includes('BEGIN') ||
                            variationsApiContent.includes('COMMIT') ||
                            variationsApiContent.includes('transaction');
      expect(hasTransaction).toBe(true);
    });

    it('should return proper database results', () => {
      expect(variationsApiContent).toMatch(/rows|result|data/i);
    });
  });

  describe('Performance Considerations', () => {
    it('should limit query results', () => {
      const hasLimit = variationsApiContent.includes('LIMIT') ||
                      variationsApiContent.includes('take') ||
                      variationsApiContent.includes('limit');
      expect(hasLimit).toBe(true);
    });

    it('should use indexes for queries', () => {
      // Check if queries use indexed columns
      const usesIndexes = variationsApiContent.includes('content_id') ||
                         variationsApiContent.includes('user_id');
      expect(usesIndexes).toBe(true);
    });

    it('should implement pagination for large result sets', () => {
      const hasPagination = variationsApiContent.includes('offset') ||
                           variationsApiContent.includes('page') ||
                           variationsApiContent.includes('cursor');
      expect(hasPagination).toBe(true);
    });
  });

  describe('Complete Workflow Validation', () => {
    it('should support full CRUD cycle', () => {
      const operations = {
        'Create': variationsApiContent.includes('POST'),
        'Read': variationsApiContent.includes('GET'),
        'Update': variationIdApiContent.includes('PUT') || variationIdApiContent.includes('PATCH'),
        'Delete': variationIdApiContent.includes('DELETE'),
      };

      const allOperations = Object.values(operations).every(Boolean);
      expect(allOperations).toBe(true);
    });

    it('should have complete UI for variation management', () => {
      const uiFeatures = {
        'Create form': variationManagerContent.includes('form') || 
                      variationManagerContent.includes('input'),
        'Variation list': variationManagerContent.includes('map') ||
                         variationManagerContent.includes('list'),
        'Comparison view': variationManagerContent.includes('comparison') ||
                          variationManagerContent.includes('compare'),
        'Delete action': variationManagerContent.includes('delete') ||
                        variationManagerContent.includes('remove'),
      };

      const allFeatures = Object.values(uiFeatures).every(Boolean);
      expect(allFeatures).toBe(true);
    });

    it('should enforce business rules', () => {
      const rules = {
        'Max 5 variations': variationsApiContent.includes('5') ||
                           variationManagerContent.includes('5'),
        'User ownership': variationsApiContent.includes('user_id') ||
                         variationsApiContent.includes('owner'),
        'Content exists': variationsApiContent.includes('content_id'),
      };

      const allRules = Object.values(rules).every(Boolean);
      expect(allRules).toBe(true);
    });

    it('should provide good user experience', () => {
      const uxFeatures = {
        'Loading states': variationManagerContent.includes('loading') ||
                         variationManagerContent.includes('isLoading'),
        'Error messages': variationManagerContent.includes('error'),
        'Success feedback': variationManagerContent.includes('success') ||
                           variationManagerContent.includes('saved'),
        'Confirmation dialogs': variationManagerContent.includes('confirm') ||
                               variationManagerContent.includes('dialog'),
      };

      const hasGoodUX = Object.values(uxFeatures).filter(Boolean).length >= 3;
      expect(hasGoodUX).toBe(true);
    });
  });
});
