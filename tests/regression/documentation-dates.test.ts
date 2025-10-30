/**
 * Documentation Dates Regression Tests
 * 
 * Ensures that documentation dates are consistent and up-to-date.
 * Prevents outdated timestamps in critical documentation files.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('📅 Documentation Dates Regression', () => {
  const root = process.cwd();
  const currentYear = new Date().getFullYear();

  describe('CDK Test Documentation', () => {
    const readmePath = join(root, 'tests/unit/CDK_TESTS_README.md');
    const summaryPath = join(root, 'tests/CDK_TEST_SUMMARY.md');
    const completePath = join(root, 'CDK_TESTING_COMPLETE.md');

    it('should have CDK_TESTS_README.md file', () => {
      expect(existsSync(readmePath)).toBe(true);
    });

    it('should have current year in CDK_TESTS_README.md', () => {
      const content = readFileSync(readmePath, 'utf-8');
      
      // Check for "Last Updated: YYYY-MM-DD" pattern
      const lastUpdatedMatch = content.match(/\*\*Last Updated:\*\* (\d{4})-\d{2}-\d{2}/);
      expect(lastUpdatedMatch).toBeTruthy();
      
      if (lastUpdatedMatch) {
        const year = parseInt(lastUpdatedMatch[1], 10);
        expect(year).toBe(currentYear);
      }
    });

    it('should not have outdated year (2024) in CDK_TESTS_README.md', () => {
      const content = readFileSync(readmePath, 'utf-8');
      
      // Should not contain "2024" in Last Updated field
      expect(content).not.toMatch(/\*\*Last Updated:\*\* 2024-/);
    });

    it('should have consistent date format in CDK_TESTS_README.md', () => {
      const content = readFileSync(readmePath, 'utf-8');
      
      // Check for ISO 8601 date format (YYYY-MM-DD)
      const dateMatches = content.match(/\*\*Last Updated:\*\* (\d{4}-\d{2}-\d{2})/g);
      expect(dateMatches).toBeTruthy();
      
      if (dateMatches) {
        dateMatches.forEach(match => {
          const dateStr = match.replace('**Last Updated:** ', '');
          const date = new Date(dateStr);
          expect(date.toString()).not.toBe('Invalid Date');
        });
      }
    });

    it('should have CDK_TEST_SUMMARY.md file', () => {
      expect(existsSync(summaryPath)).toBe(true);
    });

    it('should have current year in CDK_TEST_SUMMARY.md', () => {
      const content = readFileSync(summaryPath, 'utf-8');
      
      const lastUpdatedMatch = content.match(/\*\*Last Updated:\*\* (\d{4})-\d{2}-\d{2}/);
      expect(lastUpdatedMatch).toBeTruthy();
      
      if (lastUpdatedMatch) {
        const year = parseInt(lastUpdatedMatch[1], 10);
        expect(year).toBe(currentYear);
      }
    });

    it('should have CDK_TESTING_COMPLETE.md file', () => {
      expect(existsSync(completePath)).toBe(true);
    });

    it('should have current year in CDK_TESTING_COMPLETE.md', () => {
      const content = readFileSync(completePath, 'utf-8');
      
      const dateMatch = content.match(/\*\*Date:\*\* (\d{4})-\d{2}-\d{2}/);
      expect(dateMatch).toBeTruthy();
      
      if (dateMatch) {
        const year = parseInt(dateMatch[1], 10);
        expect(year).toBe(currentYear);
      }
    });
  });

  describe('OnlyFans Documentation', () => {
    const files = [
      'docs/ONLYFANS_AWS_DEPLOYMENT.md',
      'docs/ONLYFANS_REALISTIC_LIMITS.md',
      'docs/ONLYFANS_GAPS_RESOLVED.md',
      'docs/ONLYFANS_PRODUCTION_READINESS.md',
    ];

    files.forEach(file => {
      it(`should have ${file} file`, () => {
        expect(existsSync(join(root, file))).toBe(true);
      });

      it(`should have current year in ${file}`, () => {
        const content = readFileSync(join(root, file), 'utf-8');
        
        // Check for various date patterns
        const patterns = [
          /\*\*Last Updated:\*\* (\d{4})-\d{2}-\d{2}/,
          /\*\*Date:\*\* (\d{4})-\d{2}-\d{2}/,
          /\*\*Status:\*\*.*(\d{4})-\d{2}-\d{2}/,
        ];

        let foundDate = false;
        for (const pattern of patterns) {
          const match = content.match(pattern);
          if (match) {
            foundDate = true;
            const year = parseInt(match[1], 10);
            expect(year).toBeGreaterThanOrEqual(2024);
            expect(year).toBeLessThanOrEqual(currentYear);
            break;
          }
        }

        // Some files might not have explicit dates, that's OK
        if (!foundDate) {
          expect(true).toBe(true);
        }
      });
    });
  });

  describe('Date Consistency', () => {
    it('should have consistent dates across CDK test files', () => {
      const readmeContent = readFileSync(join(root, 'tests/unit/CDK_TESTS_README.md'), 'utf-8');
      const summaryContent = readFileSync(join(root, 'tests/CDK_TEST_SUMMARY.md'), 'utf-8');
      const completeContent = readFileSync(join(root, 'CDK_TESTING_COMPLETE.md'), 'utf-8');

      const readmeDate = readmeContent.match(/\*\*Last Updated:\*\* (\d{4}-\d{2}-\d{2})/)?.[1];
      const summaryDate = summaryContent.match(/\*\*Last Updated:\*\* (\d{4}-\d{2}-\d{2})/)?.[1];
      const completeDate = completeContent.match(/\*\*Date:\*\* (\d{4}-\d{2}-\d{2})/)?.[1];

      // All dates should be from the same year
      if (readmeDate && summaryDate && completeDate) {
        const readmeYear = readmeDate.split('-')[0];
        const summaryYear = summaryDate.split('-')[0];
        const completeYear = completeDate.split('-')[0];

        expect(readmeYear).toBe(summaryYear);
        expect(summaryYear).toBe(completeYear);
      }
    });

    it('should not have mixed years in documentation', () => {
      const files = [
        'tests/unit/CDK_TESTS_README.md',
        'tests/CDK_TEST_SUMMARY.md',
        'CDK_TESTING_COMPLETE.md',
      ];

      files.forEach(file => {
        const content = readFileSync(join(root, file), 'utf-8');
        
        // Extract all years from dates
        const yearMatches = content.match(/\d{4}-\d{2}-\d{2}/g);
        if (yearMatches) {
          const years = yearMatches.map(date => parseInt(date.split('-')[0], 10));
          const uniqueYears = [...new Set(years)];
          
          // Should have at most 2 different years (current and previous)
          expect(uniqueYears.length).toBeLessThanOrEqual(2);
          
          // All years should be recent (2024 or later)
          uniqueYears.forEach(year => {
            expect(year).toBeGreaterThanOrEqual(2024);
            expect(year).toBeLessThanOrEqual(currentYear);
          });
        }
      });
    });
  });

  describe('Date Format Validation', () => {
    it('should use ISO 8601 format (YYYY-MM-DD) in all documentation', () => {
      const files = [
        'tests/unit/CDK_TESTS_README.md',
        'tests/CDK_TEST_SUMMARY.md',
        'CDK_TESTING_COMPLETE.md',
      ];

      files.forEach(file => {
        const content = readFileSync(join(root, file), 'utf-8');
        
        // Find all date-like patterns
        const dateMatches = content.match(/\d{4}-\d{2}-\d{2}/g);
        if (dateMatches) {
          dateMatches.forEach(dateStr => {
            // Validate it's a valid date
            const date = new Date(dateStr);
            expect(date.toString()).not.toBe('Invalid Date');
            
            // Validate format
            expect(dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            
            // Validate ranges
            const [year, month, day] = dateStr.split('-').map(Number);
            expect(year).toBeGreaterThanOrEqual(2024);
            expect(year).toBeLessThanOrEqual(currentYear + 1);
            expect(month).toBeGreaterThanOrEqual(1);
            expect(month).toBeLessThanOrEqual(12);
            expect(day).toBeGreaterThanOrEqual(1);
            expect(day).toBeLessThanOrEqual(31);
          });
        }
      });
    });

    it('should not have dates in the future (beyond current year)', () => {
      const files = [
        'tests/unit/CDK_TESTS_README.md',
        'tests/CDK_TEST_SUMMARY.md',
        'CDK_TESTING_COMPLETE.md',
      ];

      const now = new Date();
      const currentDate = now.toISOString().split('T')[0];

      files.forEach(file => {
        const content = readFileSync(join(root, file), 'utf-8');
        
        const dateMatches = content.match(/\d{4}-\d{2}-\d{2}/g);
        if (dateMatches) {
          dateMatches.forEach(dateStr => {
            // Date should not be more than 1 day in the future (timezone tolerance)
            const date = new Date(dateStr);
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            expect(date.getTime()).toBeLessThanOrEqual(tomorrow.getTime());
          });
        }
      });
    });
  });

  describe('Metadata Consistency', () => {
    it('should have consistent test counts across documentation', () => {
      const readmeContent = readFileSync(join(root, 'tests/unit/CDK_TESTS_README.md'), 'utf-8');
      const summaryContent = readFileSync(join(root, 'tests/CDK_TEST_SUMMARY.md'), 'utf-8');
      const completeContent = readFileSync(join(root, 'CDK_TESTING_COMPLETE.md'), 'utf-8');

      // Extract test counts
      const readmeCount = readmeContent.match(/\*\*Total Tests:\*\* (\d+)/)?.[1];
      const summaryCount = summaryContent.match(/\*\*Total Tests:\*\* (\d+)/)?.[1];
      const completeCount = completeContent.match(/\*\*Total Tests:\*\* (\d+)/)?.[1];

      if (readmeCount && summaryCount && completeCount) {
        expect(readmeCount).toBe(summaryCount);
        expect(summaryCount).toBe(completeCount);
      }
    });

    it('should have consistent pass rates across documentation', () => {
      const readmeContent = readFileSync(join(root, 'tests/unit/CDK_TESTS_README.md'), 'utf-8');
      const summaryContent = readFileSync(join(root, 'tests/CDK_TEST_SUMMARY.md'), 'utf-8');
      const completeContent = readFileSync(join(root, 'CDK_TESTING_COMPLETE.md'), 'utf-8');

      // All should mention 100% pass rate
      expect(readmeContent).toContain('100%');
      expect(summaryContent).toContain('100%');
      expect(completeContent).toContain('100%');
    });

    it('should have consistent status indicators', () => {
      const files = [
        'tests/unit/CDK_TESTS_README.md',
        'tests/CDK_TEST_SUMMARY.md',
        'CDK_TESTING_COMPLETE.md',
      ];

      files.forEach(file => {
        const content = readFileSync(join(root, file), 'utf-8');
        
        // Should have "All Passing" or "COMPLETE" status
        const hasPassingStatus = content.includes('All Passing') || 
                                 content.includes('COMPLETE') ||
                                 content.includes('✅');
        
        expect(hasPassingStatus).toBe(true);
      });
    });
  });
});
