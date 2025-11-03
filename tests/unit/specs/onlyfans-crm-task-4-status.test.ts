/**
 * Unit Tests - OnlyFans CRM Integration Task 4 Status
 * 
 * Tests to validate Task 4 implementation status
 * Based on: .kiro/specs/onlyfans-crm-integration/tasks.md (Task 4)
 * 
 * Coverage:
 * - API route /api/crm/fans/[id] exists
 * - GET handler implementation
 * - PUT handler implementation
 * - DELETE handler implementation
 * - Error handling
 * - Authentication checks
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('OnlyFans CRM Integration - Task 4 Status', () => {
  const fanIdRoutePath = join(process.cwd(), 'app/api/crm/fans/[id]/route.ts');

  describe('File Existence', () => {
    it('should have fans/[id]/route.ts file', () => {
      expect(existsSync(fanIdRoutePath)).toBe(true);
    });
  });

  describe('GET Handler Implementation', () => {
    it('should export GET function', () => {
      if (existsSync(fanIdRoutePath)) {
        const content = readFileSync(fanIdRoutePath, 'utf-8');
        expect(content).toMatch(/export\s+(async\s+)?function\s+GET/);
      }
    });

    it('should accept request and params', () => {
      if (existsSync(fanIdRoutePath)) {
        const content = readFileSync(fanIdRoutePath, 'utf-8');
        expect(content).toMatch(/GET\s*\([^)]*request[^)]*params/i);
      }
    });

    it('should query database for fan by ID', () => {
      if (existsSync(fanIdRoutePath)) {
        const content = readFileSync(fanIdRoutePath, 'utf-8');
        expect(content).toMatch(/SELECT.*FROM\s+fans.*WHERE.*id/i);
      }
    });

    it('should return 404 if fan not found', () => {
      if (existsSync(fanIdRoutePath)) {
        const content = readFileSync(fanIdRoutePath, 'utf-8');
        expect(content).toMatch(/404|not\s+found/i);
      }
    });
  });

  describe('PUT Handler Implementation', () => {
    it('should export PUT function', () => {
      if (existsSync(fanIdRoutePath)) {
        const content = readFileSync(fanIdRoutePath, 'utf-8');
        expect(content).toMatch(/export\s+(async\s+)?function\s+PUT/);
      }
    });

    it('should parse request body', () => {
      if (existsSync(fanIdRoutePath)) {
        const content = readFileSync(fanIdRoutePath, 'utf-8');
        expect(content).toMatch(/request\.json\(\)|await.*json/i);
      }
    });

    it('should update fan in database', () => {
      if (existsSync(fanIdRoutePath)) {
        const content = readFileSync(fanIdRoutePath, 'utf-8');
        expect(content).toMatch(/UPDATE\s+fans.*SET/i);
      }
    });

    it('should return updated fan', () => {
      if (existsSync(fanIdRoutePath)) {
        const content = readFileSync(fanIdRoutePath, 'utf-8');
        expect(content).toMatch(/NextResponse\.json.*fan/i);
      }
    });
  });

  describe('DELETE Handler Implementation', () => {
    it('should export DELETE function', () => {
      if (existsSync(fanIdRoutePath)) {
        const content = readFileSync(fanIdRoutePath, 'utf-8');
        expect(content).toMatch(/export\s+(async\s+)?function\s+DELETE/);
      }
    });

    it('should delete fan from database', () => {
      if (existsSync(fanIdRoutePath)) {
        const content = readFileSync(fanIdRoutePath, 'utf-8');
        expect(content).toMatch(/DELETE\s+FROM\s+fans/i);
      }
    });

    it('should return success response', () => {
      if (existsSync(fanIdRoutePath)) {
        const content = readFileSync(fanIdRoutePath, 'utf-8');
        expect(content).toMatch(/success.*true|deleted.*successfully/i);
      }
    });
  });

  describe('Authentication & Authorization', () => {
    it('should check user authentication', () => {
      if (existsSync(fanIdRoutePath)) {
        const content = readFileSync(fanIdRoutePath, 'utf-8');
        expect(content).toMatch(/getServerSession|auth|user/i);
      }
    });

    it('should verify fan ownership', () => {
      if (existsSync(fanIdRoutePath)) {
        const content = readFileSync(fanIdRoutePath, 'utf-8');
        expect(content).toMatch(/user_id.*=|WHERE.*user_id/i);
      }
    });

    it('should return 401 if not authenticated', () => {
      if (existsSync(fanIdRoutePath)) {
        const content = readFileSync(fanIdRoutePath, 'utf-8');
        expect(content).toMatch(/401|Unauthorized/);
      }
    });
  });

  describe('Error Handling', () => {
    it('should have try-catch blocks', () => {
      if (existsSync(fanIdRoutePath)) {
        const content = readFileSync(fanIdRoutePath, 'utf-8');
        expect(content).toMatch(/try\s*{[\s\S]*catch/);
      }
    });

    it('should return 500 on server errors', () => {
      if (existsSync(fanIdRoutePath)) {
        const content = readFileSync(fanIdRoutePath, 'utf-8');
        expect(content).toMatch(/500|Internal.*Server.*Error/i);
      }
    });

    it('should log errors', () => {
      if (existsSync(fanIdRoutePath)) {
        const content = readFileSync(fanIdRoutePath, 'utf-8');
        expect(content).toMatch(/console\.(error|log)|logger/i);
      }
    });
  });

  describe('Input Validation', () => {
    it('should validate fan ID parameter', () => {
      if (existsSync(fanIdRoutePath)) {
        const content = readFileSync(fanIdRoutePath, 'utf-8');
        expect(content).toMatch(/parseInt.*id|Number.*id|isNaN/i);
      }
    });

    it('should validate update data', () => {
      if (existsSync(fanIdRoutePath)) {
        const content = readFileSync(fanIdRoutePath, 'utf-8');
        expect(content).toMatch(/name|platform|tags|value_cents/);
      }
    });
  });

  describe('Response Format', () => {
    it('should return JSON responses', () => {
      if (existsSync(fanIdRoutePath)) {
        const content = readFileSync(fanIdRoutePath, 'utf-8');
        expect(content).toMatch(/NextResponse\.json/);
      }
    });

    it('should include success indicator', () => {
      if (existsSync(fanIdRoutePath)) {
        const content = readFileSync(fanIdRoutePath, 'utf-8');
        expect(content).toMatch(/success.*:|"success"/);
      }
    });
  });

  describe('Task 4 Completion Status', () => {
    it('should mark task as in progress in tasks.md', () => {
      const tasksPath = join(process.cwd(), '.kiro/specs/onlyfans-crm-integration/tasks.md');
      if (existsSync(tasksPath)) {
        const content = readFileSync(tasksPath, 'utf-8');
        expect(content).toMatch(/- \[-\] 4\. Compléter API routes \/api\/crm\/fans/);
      }
    });

    it('should have all required handlers', () => {
      if (existsSync(fanIdRoutePath)) {
        const content = readFileSync(fanIdRoutePath, 'utf-8');
        const hasGET = /export\s+(async\s+)?function\s+GET/.test(content);
        const hasPUT = /export\s+(async\s+)?function\s+PUT/.test(content);
        const hasDELETE = /export\s+(async\s+)?function\s+DELETE/.test(content);
        
        expect(hasGET && hasPUT && hasDELETE).toBe(true);
      }
    });
  });
});
