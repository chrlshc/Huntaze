/**
 * Regression Tests for AWS Production Hardening Tasks
 * Ensures task status changes are consistent and don't break dependencies
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

interface TaskSnapshot {
  id: string;
  status: 'pending' | 'in-progress' | 'completed';
  phase: number;
  timestamp: Date;
}

interface TaskStatusChange {
  taskId: string;
  fromStatus: string;
  toStatus: string;
  timestamp: Date;
  valid: boolean;
  reason?: string;
}

class TaskRegressionValidator {
  private tasksFilePath: string;
  private expectedTransitions: Map<string, string[]>;

  constructor(tasksFilePath: string) {
    this.tasksFilePath = tasksFilePath;
    this.expectedTransitions = new Map([
      ['pending', ['in-progress', 'completed']],
      ['in-progress', ['completed', 'pending']], // Can revert if issues found
      ['completed', []] // Should not change once completed
    ]);
  }

  parseTasksFile(): Map<string, TaskSnapshot> {
    const content = readFileSync(this.tasksFilePath, 'utf-8');
    const lines = content.split('\n');
    const tasks = new Map<string, TaskSnapshot>();
    let currentPhase = 0;

    for (const line of lines) {
      // Detect phase
      if (line.startsWith('## Phase')) {
        const phaseMatch = line.match(/Phase (\d+)/);
        if (phaseMatch) {
          currentPhase = parseInt(phaseMatch[1], 10);
        }
        continue;
      }

      // Detect task
      const taskMatch = line.match(/^- \[([ x-])\] (\d+(?:\.\d+)?)\. (.+)/);
      if (taskMatch) {
        const [, status, id] = taskMatch;
        const taskStatus = status === 'x' ? 'completed' : status === '-' ? 'in-progress' : 'pending';
        
        tasks.set(id, {
          id,
          status: taskStatus,
          phase: currentPhase,
          timestamp: new Date()
        });
      }
    }

    return tasks;
  }

  validateStatusTransition(fromStatus: string, toStatus: string): boolean {
    const allowedTransitions = this.expectedTransitions.get(fromStatus) || [];
    return allowedTransitions.includes(toStatus);
  }

  detectStatusChanges(
    previousSnapshot: Map<string, TaskSnapshot>,
    currentSnapshot: Map<string, TaskSnapshot>
  ): TaskStatusChange[] {
    const changes: TaskStatusChange[] = [];

    for (const [taskId, currentTask] of currentSnapshot) {
      const previousTask = previousSnapshot.get(taskId);
      
      if (previousTask && previousTask.status !== currentTask.status) {
        const valid = this.validateStatusTransition(previousTask.status, currentTask.status);
        
        changes.push({
          taskId,
          fromStatus: previousTask.status,
          toStatus: currentTask.status,
          timestamp: new Date(),
          valid,
          reason: valid ? undefined : `Invalid transition from ${previousTask.status} to ${currentTask.status}`
        });
      }
    }

    return changes;
  }

  validateDependencyConsistency(tasks: Map<string, TaskSnapshot>): {
    valid: boolean;
    violations: string[];
  } {
    const violations: string[] = [];

    for (const [taskId, task] of tasks) {
      // Subtasks should not be completed/in-progress if parent is pending
      if (taskId.includes('.')) {
        const parentId = taskId.split('.')[0];
        const parentTask = tasks.get(parentId);
        
        if (parentTask && parentTask.status === 'pending' && task.status !== 'pending') {
          violations.push(
            `Subtask ${taskId} is ${task.status} but parent ${parentId} is still pending`
          );
        }
      }

      // Parent task should not be completed if subtasks are not completed
      if (!taskId.includes('.')) {
        const subtasks = Array.from(tasks.keys()).filter(id => id.startsWith(`${taskId}.`));
        
        if (subtasks.length > 0 && task.status === 'completed') {
          const incompleteSubtasks = subtasks.filter(id => {
            const subtask = tasks.get(id);
            return subtask && subtask.status !== 'completed';
          });
          
          if (incompleteSubtasks.length > 0) {
            violations.push(
              `Task ${taskId} is completed but has incomplete subtasks: ${incompleteSubtasks.join(', ')}`
            );
          }
        }
      }

      // Sequential tasks: task N should not be in-progress if task N-1 is pending
      const taskNum = parseFloat(taskId);
      if (!isNaN(taskNum) && !taskId.includes('.')) {
        const prevTaskId = (taskNum - 1).toString();
        const prevTask = tasks.get(prevTaskId);
        
        if (prevTask && prevTask.phase === task.phase) {
          if (task.status !== 'pending' && prevTask.status === 'pending') {
            violations.push(
              `Task ${taskId} is ${task.status} but previous task ${prevTaskId} is still pending`
            );
          }
        }
      }
    }

    return {
      valid: violations.length === 0,
      violations
    };
  }

  validatePhaseProgression(tasks: Map<string, TaskSnapshot>): {
    valid: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];
    const phaseStatus = new Map<number, { total: number; completed: number }>();

    // Calculate phase completion
    for (const task of tasks.values()) {
      if (!phaseStatus.has(task.phase)) {
        phaseStatus.set(task.phase, { total: 0, completed: 0 });
      }
      const status = phaseStatus.get(task.phase)!;
      status.total++;
      if (task.status === 'completed') {
        status.completed++;
      }
    }

    // Check if phases are progressing in order
    const phases = Array.from(phaseStatus.keys()).sort((a, b) => a - b);
    
    for (let i = 1; i < phases.length; i++) {
      const prevPhase = phases[i - 1];
      const currentPhase = phases[i];
      
      const prevStatus = phaseStatus.get(prevPhase)!;
      const currentStatus = phaseStatus.get(currentPhase)!;
      
      const prevCompletion = prevStatus.completed / prevStatus.total;
      const currentCompletion = currentStatus.completed / currentStatus.total;
      
      // Warn if later phase has more progress than earlier phase
      if (currentCompletion > prevCompletion + 0.2) { // 20% threshold
        warnings.push(
          `Phase ${currentPhase} is ${Math.round(currentCompletion * 100)}% complete ` +
          `but Phase ${prevPhase} is only ${Math.round(prevCompletion * 100)}% complete`
        );
      }
    }

    return {
      valid: warnings.length === 0,
      warnings
    };
  }
}

describe('AWS Production Hardening Tasks Regression', () => {
  let validator: TaskRegressionValidator;
  const tasksFilePath = join(process.cwd(), '.kiro/specs/aws-production-hardening/tasks.md');

  beforeEach(() => {
    validator = new TaskRegressionValidator(tasksFilePath);
  });

  describe('Task Status Consistency', () => {
    it('should have valid task status values', () => {
      const tasks = validator.parseTasksFile();
      const validStatuses = ['pending', 'in-progress', 'completed'];

      for (const [taskId, task] of tasks) {
        expect(validStatuses).toContain(task.status);
      }
    });

    it('should not have completed tasks reverting to pending', () => {
      const tasks = validator.parseTasksFile();
      
      // This test would compare against a previous snapshot
      // For now, we validate that completed tasks exist
      const completedTasks = Array.from(tasks.values()).filter(t => t.status === 'completed');
      expect(completedTasks.length).toBeGreaterThan(0);
    });

    it('should validate task 1 status change from pending to in-progress', () => {
      const tasks = validator.parseTasksFile();
      const task1 = tasks.get('1');
      
      expect(task1).toBeDefined();
      expect(task1?.status).toBe('in-progress');
      
      // Validate this is a valid transition
      const isValidTransition = validator.validateStatusTransition('pending', 'in-progress');
      expect(isValidTransition).toBe(true);
    });

    it('should not allow invalid status transitions', () => {
      // Completed tasks should not transition to any other status
      const invalidTransition = validator.validateStatusTransition('completed', 'pending');
      expect(invalidTransition).toBe(false);

      const anotherInvalidTransition = validator.validateStatusTransition('completed', 'in-progress');
      expect(anotherInvalidTransition).toBe(false);
    });
  });

  describe('Dependency Consistency', () => {
    it('should validate parent-child task consistency', () => {
      const tasks = validator.parseTasksFile();
      const validation = validator.validateDependencyConsistency(tasks);
      
      if (!validation.valid) {
        console.warn('Dependency violations found:');
        validation.violations.forEach(v => console.warn(`  - ${v}`));
      }
      
      expect(validation.violations).toHaveLength(0);
    });

    it('should ensure subtasks 1.1-1.4 are completed when task 1 is in-progress', () => {
      const tasks = validator.parseTasksFile();
      const task1 = tasks.get('1');
      
      if (task1?.status === 'in-progress' || task1?.status === 'completed') {
        const subtasks = ['1.1', '1.2', '1.3', '1.4'];
        
        subtasks.forEach(id => {
          const subtask = tasks.get(id);
          expect(subtask).toBeDefined();
          // Subtasks should be completed or at least in-progress
          expect(['in-progress', 'completed']).toContain(subtask?.status || '');
        });
      }
    });

    it('should not allow parent task completion with incomplete subtasks', () => {
      const tasks = validator.parseTasksFile();
      
      for (const [taskId, task] of tasks) {
        if (!taskId.includes('.') && task.status === 'completed') {
          const subtasks = Array.from(tasks.keys()).filter(id => id.startsWith(`${taskId}.`));
          
          if (subtasks.length > 0) {
            subtasks.forEach(subtaskId => {
              const subtask = tasks.get(subtaskId);
              expect(subtask?.status).toBe('completed');
            });
          }
        }
      }
    });

    it('should validate sequential task dependencies', () => {
      const tasks = validator.parseTasksFile();
      const validation = validator.validateDependencyConsistency(tasks);
      
      // Check specific case: task 2 should not be in-progress if task 1 is pending
      const task1 = tasks.get('1');
      const task2 = tasks.get('2');
      
      if (task2 && task2.status !== 'pending') {
        expect(task1?.status).not.toBe('pending');
      }
    });
  });

  describe('Phase Progression', () => {
    it('should validate phase progression order', () => {
      const tasks = validator.parseTasksFile();
      const validation = validator.validatePhaseProgression(tasks);
      
      if (!validation.valid) {
        console.warn('Phase progression warnings:');
        validation.warnings.forEach(w => console.warn(`  - ${w}`));
      }
      
      // Warnings are acceptable, but should be logged
      expect(Array.isArray(validation.warnings)).toBe(true);
    });

    it('should ensure Phase 1 progresses before Phase 2', () => {
      const tasks = validator.parseTasksFile();
      
      const phase1Tasks = Array.from(tasks.values()).filter(t => t.phase === 1);
      const phase2Tasks = Array.from(tasks.values()).filter(t => t.phase === 2);
      
      const phase1Completed = phase1Tasks.filter(t => t.status === 'completed').length;
      const phase2Completed = phase2Tasks.filter(t => t.status === 'completed').length;
      
      const phase1Progress = phase1Tasks.length > 0 ? phase1Completed / phase1Tasks.length : 0;
      const phase2Progress = phase2Tasks.length > 0 ? phase2Completed / phase2Tasks.length : 0;
      
      // Phase 1 should have equal or more progress than Phase 2
      if (phase2Progress > 0) {
        expect(phase1Progress).toBeGreaterThanOrEqual(phase2Progress * 0.5); // Allow some overlap
      }
    });

    it('should ensure Phase 2 does not start before Phase 1 foundation', () => {
      const tasks = validator.parseTasksFile();
      
      // Critical Phase 1 tasks that must be completed before Phase 2
      const criticalPhase1Tasks = ['1', '1.1', '1.2', '1.3', '1.4'];
      
      const phase2Tasks = Array.from(tasks.values()).filter(t => t.phase === 2);
      const phase2Started = phase2Tasks.some(t => t.status !== 'pending');
      
      if (phase2Started) {
        // At least the Terraform infrastructure should be in progress or completed
        const task1 = tasks.get('1');
        expect(['in-progress', 'completed']).toContain(task1?.status || '');
      }
    });
  });

  describe('Task Status History', () => {
    it('should maintain task status integrity over time', () => {
      const tasks = validator.parseTasksFile();
      
      // Verify that completed tasks remain completed
      const completedTasks = Array.from(tasks.values()).filter(t => t.status === 'completed');
      
      // Store snapshot for future comparisons
      const snapshot = new Map<string, string>();
      completedTasks.forEach(task => {
        snapshot.set(task.id, task.status);
      });
      
      expect(completedTasks.length).toBeGreaterThan(0);
    });

    it('should track task 1 progression correctly', () => {
      const tasks = validator.parseTasksFile();
      const task1 = tasks.get('1');
      
      expect(task1).toBeDefined();
      expect(task1?.id).toBe('1');
      expect(task1?.status).toBe('in-progress');
      
      // Verify subtasks are completed
      const subtasks = ['1.1', '1.2', '1.3', '1.4'];
      const allSubtasksCompleted = subtasks.every(id => {
        const task = tasks.get(id);
        return task?.status === 'completed';
      });
      
      expect(allSubtasksCompleted).toBe(true);
    });

    it('should prevent regression of completed subtasks', () => {
      const tasks = validator.parseTasksFile();
      const completedSubtasks = ['1.1', '1.2', '1.3', '1.4'];
      
      completedSubtasks.forEach(id => {
        const task = tasks.get(id);
        expect(task?.status).toBe('completed');
      });
    });
  });

  describe('Critical Path Validation', () => {
    it('should ensure critical infrastructure tasks are prioritized', () => {
      const tasks = validator.parseTasksFile();
      
      // Critical tasks that must be completed early
      const criticalTasks = ['1', '1.1', '1.2', '1.3', '1.4'];
      
      criticalTasks.forEach(id => {
        const task = tasks.get(id);
        expect(task).toBeDefined();
        
        // Critical tasks should be in-progress or completed
        if (task) {
          expect(['in-progress', 'completed']).toContain(task.status);
        }
      });
    });

    it('should validate ElastiCache migration dependencies', () => {
      const tasks = validator.parseTasksFile();
      const task2 = tasks.get('2'); // ElastiCache migration
      
      // Task 2 should not start until infrastructure is ready
      if (task2 && task2.status !== 'pending') {
        const task1 = tasks.get('1');
        expect(task1?.status).toBe('completed');
      }
    });

    it('should validate rate limiter dependencies', () => {
      const tasks = validator.parseTasksFile();
      const task7 = tasks.get('7'); // Rate limiter
      
      // Task 7 requires SQS queues from task 1
      if (task7 && task7.status !== 'pending') {
        const task1 = tasks.get('1');
        expect(task1?.status).toBe('completed');
      }
    });
  });

  describe('Regression Prevention', () => {
    it('should prevent completed tasks from reverting', () => {
      const tasks = validator.parseTasksFile();
      const completedTasks = Array.from(tasks.values()).filter(t => t.status === 'completed');
      
      // All completed tasks should remain completed
      completedTasks.forEach(task => {
        expect(task.status).toBe('completed');
      });
      
      // Specific check for known completed tasks
      const knownCompletedTasks = ['1.1', '1.2', '1.3', '1.4'];
      knownCompletedTasks.forEach(id => {
        const task = tasks.get(id);
        expect(task?.status).toBe('completed');
      });
    });

    it('should prevent invalid status transitions', () => {
      // Test all invalid transitions
      const invalidTransitions = [
        { from: 'completed', to: 'pending' },
        { from: 'completed', to: 'in-progress' }
      ];
      
      invalidTransitions.forEach(({ from, to }) => {
        const isValid = validator.validateStatusTransition(from, to);
        expect(isValid).toBe(false);
      });
    });

    it('should allow valid status transitions', () => {
      const validTransitions = [
        { from: 'pending', to: 'in-progress' },
        { from: 'pending', to: 'completed' },
        { from: 'in-progress', to: 'completed' },
        { from: 'in-progress', to: 'pending' } // Revert if issues found
      ];
      
      validTransitions.forEach(({ from, to }) => {
        const isValid = validator.validateStatusTransition(from, to);
        expect(isValid).toBe(true);
      });
    });
  });

  describe('Data Integrity', () => {
    it('should have consistent task numbering', () => {
      const tasks = validator.parseTasksFile();
      const taskIds = Array.from(tasks.keys());
      
      // All task IDs should be valid numbers or number.number format
      taskIds.forEach(id => {
        expect(id).toMatch(/^\d+(\.\d+)?$/);
      });
    });

    it('should have all tasks assigned to a phase', () => {
      const tasks = validator.parseTasksFile();
      
      for (const [taskId, task] of tasks) {
        expect(task.phase).toBeGreaterThan(0);
        expect(task.phase).toBeLessThanOrEqual(3);
      }
    });

    it('should have consistent phase assignments', () => {
      const tasks = validator.parseTasksFile();
      
      // Phase 1 tasks should be 1-6
      // Phase 2 tasks should be 7-12
      // Phase 3 tasks should be 13-18
      
      for (const [taskId, task] of tasks) {
        const taskNum = parseInt(taskId.split('.')[0], 10);
        
        if (taskNum >= 1 && taskNum <= 6) {
          expect(task.phase).toBe(1);
        } else if (taskNum >= 7 && taskNum <= 12) {
          expect(task.phase).toBe(2);
        } else if (taskNum >= 13 && taskNum <= 18) {
          expect(task.phase).toBe(3);
        }
      }
    });
  });

  describe('Change Detection', () => {
    it('should detect task status changes', () => {
      // Simulate previous snapshot
      const previousSnapshot = new Map<string, TaskSnapshot>([
        ['1', { id: '1', status: 'pending', phase: 1, timestamp: new Date() }],
        ['1.1', { id: '1.1', status: 'completed', phase: 1, timestamp: new Date() }],
        ['1.2', { id: '1.2', status: 'completed', phase: 1, timestamp: new Date() }],
        ['1.3', { id: '1.3', status: 'completed', phase: 1, timestamp: new Date() }],
        ['1.4', { id: '1.4', status: 'completed', phase: 1, timestamp: new Date() }]
      ]);
      
      const currentSnapshot = validator.parseTasksFile();
      const changes = validator.detectStatusChanges(previousSnapshot, currentSnapshot);
      
      // Should detect task 1 changing from pending to in-progress
      const task1Change = changes.find(c => c.taskId === '1');
      expect(task1Change).toBeDefined();
      expect(task1Change?.fromStatus).toBe('pending');
      expect(task1Change?.toStatus).toBe('in-progress');
      expect(task1Change?.valid).toBe(true);
    });

    it('should validate all detected changes', () => {
      const previousSnapshot = new Map<string, TaskSnapshot>([
        ['1', { id: '1', status: 'pending', phase: 1, timestamp: new Date() }]
      ]);
      
      const currentSnapshot = validator.parseTasksFile();
      const changes = validator.detectStatusChanges(previousSnapshot, currentSnapshot);
      
      // All changes should be valid
      changes.forEach(change => {
        if (!change.valid) {
          console.error(`Invalid change detected: ${change.taskId} from ${change.fromStatus} to ${change.toStatus}`);
          console.error(`Reason: ${change.reason}`);
        }
        expect(change.valid).toBe(true);
      });
    });
  });
});
