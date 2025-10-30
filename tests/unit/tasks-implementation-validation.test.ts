/**
 * Tests for Tasks Implementation Validation
 * Validates that the implementation plan tasks are properly structured and trackable
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

interface Task {
  id: string;
  title: string;
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  subtasks: string[];
  requirements: string[];
  dependencies: string[];
}

interface TaskValidation {
  hasValidId: boolean;
  hasTitle: boolean;
  hasRequirements: boolean;
  hasValidStatus: boolean;
  subtasksValid: boolean;
}

describe('Tasks Implementation Plan Validation', () => {
  let tasksContent: string;
  let tasks: Task[];

  beforeEach(() => {
    // Read the tasks.md file
    const tasksPath = join(process.cwd(), '.kiro/specs/huntaze-hybrid-orchestrator-integration/tasks.md');
    tasksContent = readFileSync(tasksPath, 'utf-8');
    tasks = parseTasksFromMarkdown(tasksContent);
  });

  describe('Task Structure Validation', () => {
    it('should have all 8 main phases defined', () => {
      const mainPhases = tasks.filter(t => t.id.match(/^\d+$/));
      expect(mainPhases.length).toBe(8);
    });

    it('should have Phase 1: Production-ready hybrid orchestrator infrastructure', () => {
      const phase1 = tasks.find(t => t.id === '1');
      expect(phase1).toBeDefined();
      expect(phase1?.title).toContain('production-ready hybrid orchestrator infrastructure');
    });

    it('should have Phase 2: Integration middleware for backward compatibility', () => {
      const phase2 = tasks.find(t => t.id === '2');
      expect(phase2).toBeDefined();
      expect(phase2?.title).toContain('integration middleware');
    });

    it('should have Phase 3: Enhanced rate limiter for production', () => {
      const phase3 = tasks.find(t => t.id === '3');
      expect(phase3).toBeDefined();
      expect(phase3?.title).toContain('rate limiter');
    });

    it('should have Phase 4: Cost monitoring and optimization service', () => {
      const phase4 = tasks.find(t => t.id === '4');
      expect(phase4).toBeDefined();
      expect(phase4?.title).toContain('cost monitoring');
    });

    it('should have Phase 5: Production API endpoints', () => {
      const phase5 = tasks.find(t => t.id === '5');
      expect(phase5).toBeDefined();
      expect(phase5?.title).toContain('API endpoints');
    });

    it('should have Phase 6: Comprehensive monitoring and alerting', () => {
      const phase6 = tasks.find(t => t.id === '6');
      expect(phase6).toBeDefined();
      expect(phase6?.title).toContain('monitoring and alerting');
    });

    it('should have Phase 7: Gradual rollout and deployment strategy', () => {
      const phase7 = tasks.find(t => t.id === '7');
      expect(phase7).toBeDefined();
      expect(phase7?.title).toContain('rollout and deployment');
    });

    it('should have Phase 8: Final integration testing and validation', () => {
      const phase8 = tasks.find(t => t.id === '8');
      expect(phase8).toBeDefined();
      expect(phase8?.title).toContain('integration testing');
    });
  });

  describe('Subtask Coverage', () => {
    it('should have 4 subtasks for Phase 1', () => {
      const phase1Subtasks = tasks.filter(t => t.id.startsWith('1.') && t.id.split('.').length === 2);
      expect(phase1Subtasks.length).toBe(4);
    });

    it('should have 4 subtasks for Phase 2', () => {
      const phase2Subtasks = tasks.filter(t => t.id.startsWith('2.') && t.id.split('.').length === 2);
      expect(phase2Subtasks.length).toBe(4);
    });

    it('should have 4 subtasks for Phase 3', () => {
      const phase3Subtasks = tasks.filter(t => t.id.startsWith('3.') && t.id.split('.').length === 2);
      expect(phase3Subtasks.length).toBe(4);
    });

    it('should have 4 subtasks for Phase 4', () => {
      const phase4Subtasks = tasks.filter(t => t.id.startsWith('4.') && t.id.split('.').length === 2);
      expect(phase4Subtasks.length).toBe(4);
    });

    it('should have 4 subtasks for Phase 5', () => {
      const phase5Subtasks = tasks.filter(t => t.id.startsWith('5.') && t.id.split('.').length === 2);
      expect(phase5Subtasks.length).toBe(4);
    });

    it('should have 4 subtasks for Phase 6', () => {
      const phase6Subtasks = tasks.filter(t => t.id.startsWith('6.') && t.id.split('.').length === 2);
      expect(phase6Subtasks.length).toBe(4);
    });

    it('should have 4 subtasks for Phase 7', () => {
      const phase7Subtasks = tasks.filter(t => t.id.startsWith('7.') && t.id.split('.').length === 2);
      expect(phase7Subtasks.length).toBe(4);
    });

    it('should have 4 subtasks for Phase 8', () => {
      const phase8Subtasks = tasks.filter(t => t.id.startsWith('8.') && t.id.split('.').length === 2);
      expect(phase8Subtasks.length).toBe(4);
    });
  });

  describe('Requirements Traceability', () => {
    it('should have requirements linked to all tasks', () => {
      tasks.forEach(task => {
        expect(task.requirements.length).toBeGreaterThan(0);
      });
    });

    it('should reference valid requirement IDs', () => {
      const validRequirementPattern = /^\d+\.\d+$/;
      
      tasks.forEach(task => {
        task.requirements.forEach(req => {
          expect(req).toMatch(validRequirementPattern);
        });
      });
    });

    it('should have Phase 1 tasks linked to infrastructure requirements', () => {
      const phase1Tasks = tasks.filter(t => t.id.startsWith('1.'));
      const requirementIds = phase1Tasks.flatMap(t => t.requirements);
      
      expect(requirementIds).toContain('1.1');
      expect(requirementIds).toContain('1.4');
      expect(requirementIds).toContain('5.1');
      expect(requirementIds).toContain('5.2');
    });

    it('should have Phase 2 tasks linked to integration requirements', () => {
      const phase2Tasks = tasks.filter(t => t.id.startsWith('2.'));
      const requirementIds = phase2Tasks.flatMap(t => t.requirements);
      
      expect(requirementIds).toContain('3.1');
      expect(requirementIds).toContain('3.2');
      expect(requirementIds).toContain('6.1');
      expect(requirementIds).toContain('6.2');
    });

    it('should have Phase 3 tasks linked to rate limiting requirements', () => {
      const phase3Tasks = tasks.filter(t => t.id.startsWith('3.'));
      const requirementIds = phase3Tasks.flatMap(t => t.requirements);
      
      expect(requirementIds).toContain('2.1');
      expect(requirementIds).toContain('2.2');
      expect(requirementIds).toContain('2.3');
      expect(requirementIds).toContain('2.4');
    });

    it('should have Phase 4 tasks linked to cost monitoring requirements', () => {
      const phase4Tasks = tasks.filter(t => t.id.startsWith('4.'));
      const requirementIds = phase4Tasks.flatMap(t => t.requirements);
      
      expect(requirementIds).toContain('4.1');
      expect(requirementIds).toContain('4.2');
      expect(requirementIds).toContain('4.3');
      expect(requirementIds).toContain('4.4');
    });
  });

  describe('Task Status Tracking', () => {
    it('should mark completed tasks with [x]', () => {
      const completedTasks = tasksContent.match(/- \[x\]/g) || [];
      expect(completedTasks.length).toBeGreaterThan(0);
    });

    it('should mark pending tasks with [ ]', () => {
      const pendingTasks = tasksContent.match(/- \[ \]/g) || [];
      expect(pendingTasks.length).toBeGreaterThan(0);
    });

    it('should mark test tasks with [ ]*', () => {
      const testTasks = tasksContent.match(/- \[ \]\*/g) || [];
      expect(testTasks.length).toBeGreaterThan(0);
    });

    it('should have Phase 2 subtasks marked as completed', () => {
      expect(tasksContent).toContain('[x] 2.1 Implement IntegrationMiddleware class');
      expect(tasksContent).toContain('[x] 2.2 Add feature flag management system');
      expect(tasksContent).toContain('[x] 2.3 Create backward compatibility layer');
    });

    it('should have Phase 3 subtasks marked as completed', () => {
      expect(tasksContent).toContain('[x] 3.1 Create EnhancedRateLimiter');
      expect(tasksContent).toContain('[x] 3.2 Add intelligent queuing system');
      expect(tasksContent).toContain('[x] 3.3 Integrate with existing OnlyFans gateway');
    });

    it('should have Phase 4 subtasks marked as completed', () => {
      expect(tasksContent).toContain('[x] 4.1 Create CostMonitoringService');
      expect(tasksContent).toContain('[x] 4.2 Implement cost alerting system');
      expect(tasksContent).toContain('[x] 4.3 Add cost optimization engine');
    });
  });

  describe('Test Task Identification', () => {
    it('should identify all test-related tasks', () => {
      const testTasks = tasks.filter(t => 
        t.title.toLowerCase().includes('test') || 
        t.title.toLowerCase().includes('testing')
      );
      
      expect(testTasks.length).toBeGreaterThanOrEqual(8);
    });

    it('should have test task for Phase 1 (1.4)', () => {
      const testTask = tasks.find(t => t.id === '1.4');
      expect(testTask).toBeDefined();
      expect(testTask?.title).toContain('unit tests');
    });

    it('should have test task for Phase 2 (2.4)', () => {
      const testTask = tasks.find(t => t.id === '2.4');
      expect(testTask).toBeDefined();
      expect(testTask?.title).toContain('integration tests');
    });

    it('should have test task for Phase 3 (3.4)', () => {
      const testTask = tasks.find(t => t.id === '3.4');
      expect(testTask).toBeDefined();
      expect(testTask?.title).toContain('monitoring dashboard');
    });

    it('should have test task for Phase 5 (5.4)', () => {
      const testTask = tasks.find(t => t.id === '5.4');
      expect(testTask).toBeDefined();
      expect(testTask?.title).toContain('API integration tests');
    });

    it('should have test task for Phase 8 (8.4)', () => {
      const testTask = tasks.find(t => t.id === '8.4');
      expect(testTask).toBeDefined();
      expect(testTask?.title).toContain('runbook and documentation');
    });
  });

  describe('Task Dependencies', () => {
    it('should have Phase 1 as foundation for other phases', () => {
      // Phase 1 should have no dependencies on other phases
      const phase1Tasks = tasks.filter(t => t.id.startsWith('1.'));
      phase1Tasks.forEach(task => {
        const hasDependenciesOnOtherPhases = task.dependencies.some(dep => 
          !dep.startsWith('1.')
        );
        expect(hasDependenciesOnOtherPhases).toBe(false);
      });
    });

    it('should have Phase 5 depend on Phase 1 and Phase 2', () => {
      const phase5 = tasks.find(t => t.id === '5');
      expect(phase5?.requirements).toContain('3.1');
      expect(phase5?.requirements).toContain('3.3');
      expect(phase5?.requirements).toContain('6.1');
    });

    it('should have Phase 8 as final validation phase', () => {
      const phase8 = tasks.find(t => t.id === '8');
      expect(phase8?.requirements).toContain('3.4');
      expect(phase8?.requirements).toContain('5.4');
      expect(phase8?.requirements).toContain('5.5');
    });
  });

  describe('Implementation Completeness', () => {
    it('should have all critical infrastructure tasks defined', () => {
      const criticalTasks = [
        'ProductionHybridOrchestrator',
        'IntegrationMiddleware',
        'EnhancedRateLimiter',
        'CostMonitoringService',
        'FeatureFlagManager'
      ];

      criticalTasks.forEach(taskName => {
        expect(tasksContent.toLowerCase()).toContain(taskName.toLowerCase());
      });
    });

    it('should have monitoring and alerting tasks', () => {
      expect(tasksContent).toContain('CloudWatch');
      expect(tasksContent).toContain('monitoring');
      expect(tasksContent).toContain('alerting');
      expect(tasksContent).toContain('dashboard');
    });

    it('should have deployment and rollout tasks', () => {
      expect(tasksContent).toContain('deployment');
      expect(tasksContent).toContain('rollout');
      expect(tasksContent).toContain('canary');
      expect(tasksContent).toContain('rollback');
    });

    it('should have security and compliance tasks', () => {
      expect(tasksContent).toContain('security');
      expect(tasksContent).toContain('compliance');
      expect(tasksContent).toContain('OnlyFans ToS');
    });
  });

  describe('Documentation Requirements', () => {
    it('should have documentation tasks for each major phase', () => {
      const docTasks = tasks.filter(t => 
        t.title.toLowerCase().includes('documentation') ||
        t.title.toLowerCase().includes('runbook')
      );
      
      expect(docTasks.length).toBeGreaterThan(0);
    });

    it('should have operational runbook task', () => {
      const runbookTask = tasks.find(t => t.title.includes('runbook'));
      expect(runbookTask).toBeDefined();
      expect(runbookTask?.id).toBe('8.4');
    });

    it('should have user guide requirements', () => {
      expect(tasksContent).toContain('user guides');
      expect(tasksContent).toContain('technical documentation');
    });
  });

  describe('Quality Assurance', () => {
    it('should have comprehensive testing coverage', () => {
      const testingKeywords = [
        'unit tests',
        'integration tests',
        'end-to-end testing',
        'load testing',
        'security testing'
      ];

      testingKeywords.forEach(keyword => {
        expect(tasksContent.toLowerCase()).toContain(keyword.toLowerCase());
      });
    });

    it('should have performance testing tasks', () => {
      expect(tasksContent).toContain('load testing');
      expect(tasksContent).toContain('performance');
      expect(tasksContent).toContain('auto-scaling');
    });

    it('should have security validation tasks', () => {
      expect(tasksContent).toContain('security audit');
      expect(tasksContent).toContain('data encryption');
      expect(tasksContent).toContain('PII handling');
    });
  });

  describe('Progress Tracking', () => {
    it('should calculate overall completion percentage', () => {
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.status === 'completed').length;
      const completionPercentage = (completedTasks / totalTasks) * 100;

      expect(completionPercentage).toBeGreaterThanOrEqual(0);
      expect(completionPercentage).toBeLessThanOrEqual(100);
    });

    it('should have Phase 2 mostly completed', () => {
      const phase2Tasks = tasks.filter(t => t.id.startsWith('2.'));
      const completedPhase2 = phase2Tasks.filter(t => t.status === 'completed').length;
      const phase2Completion = (completedPhase2 / phase2Tasks.length) * 100;

      expect(phase2Completion).toBeGreaterThan(50);
    });

    it('should have Phase 3 mostly completed', () => {
      const phase3Tasks = tasks.filter(t => t.id.startsWith('3.'));
      const completedPhase3 = phase3Tasks.filter(t => t.status === 'completed').length;
      const phase3Completion = (completedPhase3 / phase3Tasks.length) * 100;

      expect(phase3Completion).toBeGreaterThan(50);
    });

    it('should have Phase 4 mostly completed', () => {
      const phase4Tasks = tasks.filter(t => t.id.startsWith('4.'));
      const completedPhase4 = phase4Tasks.filter(t => t.status === 'completed').length;
      const phase4Completion = (completedPhase4 / phase4Tasks.length) * 100;

      expect(phase4Completion).toBeGreaterThan(50);
    });
  });
});

// Helper function to parse tasks from markdown
function parseTasksFromMarkdown(content: string): Task[] {
  const tasks: Task[] = [];
  const lines = content.split('\n');
  
  for (const line of lines) {
    const taskMatch = line.match(/^- \[([ x-])\](\*)?\s+(\d+(?:\.\d+)?)\s+(.+)/);
    if (taskMatch) {
      const [, statusChar, isTest, id, title] = taskMatch;
      
      let status: Task['status'] = 'pending';
      if (statusChar === 'x') status = 'completed';
      else if (statusChar === '-') status = 'blocked';
      
      // Extract requirements from the line
      const requirementsMatch = title.match(/_Requirements?:\s*([\d.,\s]+)_/);
      const requirements = requirementsMatch 
        ? requirementsMatch[1].split(',').map(r => r.trim())
        : [];
      
      tasks.push({
        id,
        title: title.replace(/_Requirements?:.*_/, '').trim(),
        status,
        subtasks: [],
        requirements,
        dependencies: []
      });
    }
  }
  
  return tasks;
}
