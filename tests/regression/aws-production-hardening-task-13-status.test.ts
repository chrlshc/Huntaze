/**
 * Regression Test for AWS Production Hardening Task 13 Status Change
 * Validates that task 13 (comprehensive security validation) status transition is tracked correctly
 * 
 * Context: Task 13 was changed from [ ] (pending) to [-] (in-progress)
 * This test ensures the status change is properly reflected and validated
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

interface Task {
  id: string;
  title: string;
  status: 'pending' | 'in-progress' | 'completed';
  phase: string;
  requirements: string[];
  subtasks: string[];
}

class Task13Validator {
  private tasksContent: string;
  private task13: Task | null = null;

  constructor(tasksFilePath: string) {
    try {
      this.tasksContent = readFileSync(tasksFilePath, 'utf-8');
      this.parseTask13();
    } catch (error) {
      console.error('Failed to load tasks file:', error);
      this.tasksContent = '';
    }
  }

  private parseTask13(): void {
    const lines = this.tasksContent.split('\n');
    let inTask13 = false;
    let currentPhase = '';
    const subtasks: string[] = [];
    const requirements: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Detect phase
      if (line.startsWith('## Phase')) {
        currentPhase = line.replace('##', '').trim();
        continue;
      }

      // Detect task 13
      const task13Match = line.match(/^- \[([ x-])\] 13\. (.+)/);
      if (task13Match) {
        const [, status, title] = task13Match;
        const taskStatus = status === 'x' ? 'completed' : status === '-' ? 'in-progress' : 'pending';
        
        this.task13 = {
          id: '13',
          title,
          status: taskStatus,
          phase: currentPhase,
          requirements: [],
          subtasks: []
        };
        inTask13 = true;
        continue;
      }

      // Parse task 13 details
      if (inTask13) {
        // Check if we've moved to next task
        if (line.match(/^- \[([ x-])\] \d+\./)) {
          inTask13 = false;
          break;
        }

        // Extract subtasks (indented bullet points)
        if (line.trim().startsWith('-') && !line.includes('_Requirements:')) {
          subtasks.push(line.trim().replace(/^-\s*/, ''));
        }

        // Extract requirements
        if (line.includes('_Requirements:')) {
          const reqMatch = line.match(/_Requirements: (.+)_/);
          if (reqMatch) {
            requirements.push(...reqMatch[1].split(',').map(r => r.trim()));
          }
        }
      }
    }

    if (this.task13) {
      this.task13.subtasks = subtasks;
      this.task13.requirements = requirements;
    }
  }

  getTask13(): Task | null {
    return this.task13;
  }

  validateStatusTransition(): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!this.task13) {
      errors.push('Task 13 not foun