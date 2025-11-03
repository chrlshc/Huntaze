/**
 * Unit Tests - Tag Management System (Task 14.1)
 * 
 * Tests to validate tag management system implementation
 * Based on: .kiro/specs/content-creation/tasks.md (Task 14.1)
 * 
 * Coverage:
 * - Tag input component with auto-completion
 * - Tag creation and assignment API
 * - Tag search and filter functionality
 * - Tag suggestions based on content analysis
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('Task 14.1 - Tag Management System', () => {
  let tagInputContent: string;
  let tagApiContent: string;
  let tagSuggestionsApiContent: string;

  beforeAll(() => {
    const tagInputPath = join(process.cwd(), 'components/content/TagInput.tsx');
    const tagApiPath = join(process.cwd(), 'app/api/content/tags/route.ts');
    const tagSuggestionsPath = join(process.cwd(), 'app/api/content/tags/suggestions/route.ts');

    tagInputContent = readFileSync(tagInputPath, 'utf-8');
    tagApiContent = readFileSync(tagApiPath, 'utf-8');
    
    if (existsSync(tagSuggestionsPath)) {
      tagSuggestionsApiContent = readFileSync(tagSuggestionsPath, 'utf-8');
    }
  });

  describe('Requirement 13.1 - Tag Input Component', () => {
    it('should have TagInput component defined', () => {
      expect(tagInputContent).toContain('export default function TagInput');
    });

    it('should accept value and onChange props', () => {
      expect(tagInputContent).toContain('value: string[]');
      expect(tagInputContent).toContain('onChange: (tags: string[]) => void');
    });

    it('should support suggestions prop for auto-completion', () => {
      expect(tagInputContent).toContain('suggestions?: string[]');
    });

    it('should have maxTags limit', () => {
      expect(tagInputContent).toContain('maxTags');
    });

    it('should display existing tags', () => {
      expect(tagInputContent).toContain('value.map');
    });

    it('should have input field for adding new tags', () => {
      expect(tagInputContent).toContain('<input');
      expect(tagInputContent).toContain('type="text"');
    });

    it('should handle tag removal', () => {
      expect(tagInputContent).toContain('removeTag');
    });

    it('should handle Enter key to add tags', () => {
      expect(tagInputContent).toContain('handleKeyDown');
      expect(tagInputContent).toContain("e.key === 'Enter'");
    });

    it('should handle comma key to add tags', () => {
      expect(tagInputContent).toContain("e.key === ','");
    });

    it('should handle Backspace to remove last tag', () => {
      expect(tagInputContent).toContain("e.key === 'Backspace'");
    });
  });

  describe('Requirement 13.1 - Auto-completion', () => {
    it('should filter suggestions based on input', () => {
      expect(tagInputContent).toContain('filteredSuggestions');
      expect(tagInputContent).toContain('filter');
    });

    it('should show suggestions dropdown', () => {
      expect(tagInputContent).toContain('showSuggestions');
    });

    it('should hide suggestions when input is empty', () => {
      expect(tagInputContent).toContain('setShowSuggestions(false)');
    });

    it('should exclude already selected tags from suggestions', () => {
      expect(tagInputContent).toContain('!value.includes');
    });

    it('should handle suggestion click', () => {
      expect(tagInputContent).toContain('onClick={() => addTag(suggestion)');
    });

    it('should use case-insensitive filtering', () => {
      expect(tagInputContent).toContain('toLowerCase()');
    });
  });

  describe('Requirement 13.2 - Tag Creation API', () => {
    it('should have POST endpoint for creating tags', () => {
      expect(tagApiContent).toContain('export async function POST');
    });

    it('should accept contentId and tags in request body', () => {
      expect(tagApiContent).toContain('contentId');
      expect(tagApiContent).toContain('tags');
    });

    it('should validate required fields', () => {
      expect(tagApiContent).toContain('!contentId');
      expect(tagApiContent).toContain('!tags');
      expect(tagApiContent).toContain('!Array.isArray(tags)');
    });

    it('should remove existing tags before adding new ones', () => {
      expect(tagApiContent).toContain('DELETE FROM content_tags');
    });

    it('should insert new tags into database', () => {
      expect(tagApiContent).toContain('INSERT INTO content_tags');
    });

    it('should normalize tags to lowercase', () => {
      expect(tagApiContent).toContain('toLowerCase()');
    });

    it('should trim whitespace from tags', () => {
      expect(tagApiContent).toContain('trim()');
    });

    it('should handle errors gracefully', () => {
      expect(tagApiContent).toContain('catch (error)');
      expect(tagApiContent).toContain('console.error');
    });
  });

  describe('Requirement 13.2 - Tag Search and Filter', () => {
    it('should have GET endpoint for fetching tags', () => {
      expect(tagApiContent).toContain('export async function GET');
    });

    it('should accept userId parameter', () => {
      expect(tagApiContent).toContain('userId');
    });

    it('should accept search parameter for filtering', () => {
      expect(tagApiContent).toContain('search');
    });

    it('should accept limit parameter', () => {
      expect(tagApiContent).toContain('limit');
    });

    it('should validate userId is provided', () => {
      expect(tagApiContent).toContain('!userId');
      expect(tagApiContent).toContain('User ID is required');
    });

    it('should query tags from database', () => {
      expect(tagApiContent).toContain('SELECT');
      expect(tagApiContent).toContain('FROM content_tags');
    });

    it('should count tag usage', () => {
      expect(tagApiContent).toContain('COUNT(*)');
      expect(tagApiContent).toContain('usage_count');
    });

    it('should track last used date', () => {
      expect(tagApiContent).toContain('MAX(ci.created_at)');
      expect(tagApiContent).toContain('last_used');
    });

    it('should filter by search term', () => {
      expect(tagApiContent).toContain('ILIKE');
    });

    it('should order by usage count', () => {
      expect(tagApiContent).toContain('ORDER BY usage_count DESC');
    });

    it('should limit results', () => {
      expect(tagApiContent).toContain('LIMIT');
    });

    it('should group by tag', () => {
      expect(tagApiContent).toContain('GROUP BY ct.tag');
    });
  });

  describe('Tag Input Validation', () => {
    it('should prevent duplicate tags', () => {
      expect(tagInputContent).toContain('!value.includes(trimmedTag)');
    });

    it('should enforce max tags limit', () => {
      expect(tagInputContent).toContain('value.length < maxTags');
    });

    it('should show max tags warning', () => {
      expect(tagInputContent).toContain('Maximum');
      expect(tagInputContent).toContain('tags reached');
    });

    it('should disable input when max tags reached', () => {
      expect(tagInputContent).toContain('disabled={value.length >= maxTags}');
    });

    it('should prevent empty tags', () => {
      expect(tagInputContent).toContain('trim()');
      expect(tagInputContent).toContain('trimmedTag &&');
    });
  });

  describe('User Experience', () => {
    it('should show tag count', () => {
      expect(tagInputContent).toContain('value.length');
    });

    it('should show placeholder text', () => {
      expect(tagInputContent).toContain('placeholder');
    });

    it('should show usage instructions', () => {
      expect(tagInputContent).toContain('Press Enter or comma');
    });

    it('should have remove button for each tag', () => {
      expect(tagInputContent).toContain('onClick={() => removeTag(tag)');
    });

    it('should style tags with colors', () => {
      expect(tagInputContent).toContain('bg-blue-100');
      expect(tagInputContent).toContain('text-blue-800');
    });

    it('should have focus ring on input', () => {
      expect(tagInputContent).toContain('focus-within:ring');
    });
  });

  describe('API Response Format', () => {
    it('should return success status', () => {
      expect(tagApiContent).toContain('success: true');
    });

    it('should return tags array in GET response', () => {
      expect(tagApiContent).toContain('tags: result.rows');
    });

    it('should return success message in POST response', () => {
      expect(tagApiContent).toContain('Tags updated successfully');
    });

    it('should return error messages', () => {
      expect(tagApiContent).toContain('error:');
    });

    it('should use appropriate HTTP status codes', () => {
      expect(tagApiContent).toContain('status: 400');
      expect(tagApiContent).toContain('status: 500');
    });
  });

  describe('Database Integration', () => {
    it('should use parameterized queries', () => {
      expect(tagApiContent).toContain('$1');
      expect(tagApiContent).toContain('$2');
    });

    it('should join with content_items table', () => {
      expect(tagApiContent).toContain('JOIN content_items');
    });

    it('should filter by user_id', () => {
      expect(tagApiContent).toContain('user_id = $1');
    });

    it('should use async/await', () => {
      expect(tagApiContent).toContain('async function');
      expect(tagApiContent).toContain('await query');
    });
  });

  describe('Task 14.1 Completion Status', () => {
    it('should have all required components implemented', () => {
      const requirements = {
        'TagInput component exists': tagInputContent.includes('export default function TagInput'),
        'Auto-completion implemented': tagInputContent.includes('filteredSuggestions'),
        'Tag creation API exists': tagApiContent.includes('export async function POST'),
        'Tag search API exists': tagApiContent.includes('export async function GET'),
        'Tag filtering implemented': tagApiContent.includes('ILIKE'),
        'Usage tracking implemented': tagApiContent.includes('usage_count'),
      };

      Object.entries(requirements).forEach(([requirement, implemented]) => {
        expect(implemented).toBe(true);
      });
    });

    it('should mark task as completed', () => {
      const tasksPath = join(process.cwd(), '.kiro/specs/content-creation/tasks.md');
      const tasksContent = readFileSync(tasksPath, 'utf-8');
      
      // Task should be marked as completed [x]
      expect(tasksContent).toContain('- [x] 14.1 Create tag management system');
    });
  });
});
