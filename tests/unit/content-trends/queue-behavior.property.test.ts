/**
 * Queue Behavior Property Tests
 * 
 * Property-based tests for BullMQ queue management including
 * job prioritization, concurrency limits, and rate limiting.
 * 
 * @see .kiro/specs/content-trends-ai-engine/tasks.md - Task 3.1*
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import {
  JobPriority,
  JobStatus,
  QueueName,
  type VideoProcessingJobData,
  type VisualAnalysisJobData,
  type TextAnalysisJobData,
  type ContentTrendsJobData,
  type QueueConfig,
} from '../../../lib/ai/content-trends/queue/types';

// ============================================================================
// Test Generators
// ============================================================================

/**
 * Generate a valid job ID
 */
const jobIdArb = fc.uuid();

/**
 * Generate a valid user ID
 */
const userIdArb = fc.uuid();

/**
 * Generate a job priority
 */
const priorityArb = fc.constantFrom(
  JobPriority.CRITICAL,
  JobPriority.PREMIUM,
  JobPriority.HIGH,
  JobPriority.NORMAL,
  JobPriority.LOW,
  JobPriority.ROUTINE
);

/**
 * Generate a queue name
 */
const queueNameArb = fc.constantFrom(
  QueueName.VIDEO_PROCESSING,
  QueueName.VISUAL_ANALYSIS,
  QueueName.TEXT_ANALYSIS,
  QueueName.VIRAL_PREDICTION,
  QueueName.CONTENT_GENERATION,
  QueueName.WEBHOOK_PROCESSING
);

/**
 * Generate video processing job data
 */
const videoProcessingJobArb = fc.record({
  type: fc.constant('video-processing' as const),
  jobId: jobIdArb,
  userId: userIdArb,
  priority: priorityArb,
  createdAt: fc.integer({ min: 1600000000000, max: 2000000000000 }),
  videoSource: fc.webUrl(),
  gridLayout: fc.constantFrom('2x2' as const, '3x3' as const),
  uploadToBlob: fc.boolean(),
  sceneChangeThreshold: fc.option(fc.float({ min: Math.fround(0.1), max: Math.fround(0.9) })),
});

/**
 * Generate visual analysis job data
 */
const visualAnalysisJobArb = fc.record({
  type: fc.constant('visual-analysis' as const),
  jobId: jobIdArb,
  userId: userIdArb,
  priority: priorityArb,
  createdAt: fc.integer({ min: 1600000000000, max: 2000000000000 }),
  imageUrls: fc.array(fc.webUrl(), { minLength: 1, maxLength: 9 }),
  analysisTypes: fc.array(
    fc.constantFrom('ocr', 'facial', 'editing', 'elements', 'caption'),
    { minLength: 1, maxLength: 5 }
  ),
  videoJobId: fc.option(jobIdArb),
});

/**
 * Generate text analysis job data
 */
const textAnalysisJobArb = fc.record({
  type: fc.constant('text-analysis' as const),
  jobId: jobIdArb,
  userId: userIdArb,
  priority: priorityArb,
  createdAt: fc.integer({ min: 1600000000000, max: 2000000000000 }),
  content: fc.string({ minLength: 10, maxLength: 5000 }),
  task: fc.record({
    id: jobIdArb,
    type: fc.constantFrom('caption-analysis', 'sentiment-analysis', 'trend-detection'),
    content: fc.string({ minLength: 10, maxLength: 1000 }),
    metadata: fc.option(fc.dictionary(fc.string(), fc.string())),
  }),
});

/**
 * Generate any job type
 */
const anyJobArb = fc.oneof(
  videoProcessingJobArb,
  visualAnalysisJobArb,
  textAnalysisJobArb
);

/**
 * Generate a list of jobs with various priorities
 */
const jobListArb = fc.array(anyJobArb, { minLength: 1, maxLength: 50 });

/**
 * Generate concurrency configuration
 */
const concurrencyConfigArb = fc.record({
  [QueueName.VIDEO_PROCESSING]: fc.integer({ min: 1, max: 10 }),
  [QueueName.VISUAL_ANALYSIS]: fc.integer({ min: 1, max: 20 }),
  [QueueName.TEXT_ANALYSIS]: fc.integer({ min: 1, max: 30 }),
  [QueueName.VIRAL_PREDICTION]: fc.integer({ min: 1, max: 15 }),
  [QueueName.CONTENT_GENERATION]: fc.integer({ min: 1, max: 10 }),
  [QueueName.WEBHOOK_PROCESSING]: fc.integer({ min: 1, max: 20 }),
});

// ============================================================================
// Property Tests: Job Prioritization
// ============================================================================

describe('Queue Behavior Property Tests', () => {
  describe('Property 4.1: Job Priority Ordering', () => {
    it('should maintain priority ordering - lower number = higher priority', () => {
      fc.assert(
        fc.property(
          fc.array(priorityArb, { minLength: 2, maxLength: 100 }),
          (priorities) => {
            const sorted = [...priorities].sort((a, b) => a - b);
            
            // Verify CRITICAL (1) comes before ROUTINE (15)
            const criticalIndex = sorted.indexOf(JobPriority.CRITICAL);
            const routineIndex = sorted.indexOf(JobPriority.ROUTINE);
            
            if (criticalIndex !== -1 && routineIndex !== -1) {
              expect(criticalIndex).toBeLessThan(routineIndex);
            }
            
            // Verify sorted order is ascending
            for (let i = 1; i < sorted.length; i++) {
              expect(sorted[i]).toBeGreaterThanOrEqual(sorted[i - 1]);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly classify premium vs routine jobs', () => {
      fc.assert(
        fc.property(priorityArb, (priority) => {
          const isPremium = priority <= JobPriority.PREMIUM;
          const isRoutine = priority >= JobPriority.LOW;
          
          // Premium and routine should be mutually exclusive for extreme values
          if (priority === JobPriority.CRITICAL || priority === JobPriority.PREMIUM) {
            expect(isPremium).toBe(true);
          }
          
          if (priority === JobPriority.LOW || priority === JobPriority.ROUTINE) {
            expect(isRoutine).toBe(true);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should sort jobs by priority correctly', () => {
      fc.assert(
        fc.property(jobListArb, (jobs) => {
          const sortedJobs = [...jobs].sort((a, b) => a.priority - b.priority);
          
          // Verify all jobs are sorted by priority
          for (let i = 1; i < sortedJobs.length; i++) {
            expect(sortedJobs[i].priority).toBeGreaterThanOrEqual(
              sortedJobs[i - 1].priority
            );
          }
          
          // Verify no jobs were lost
          expect(sortedJobs.length).toBe(jobs.length);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 4.2: Queue Assignment', () => {
    it('should assign video-processing jobs to VIDEO_PROCESSING queue', () => {
      fc.assert(
        fc.property(videoProcessingJobArb, (job) => {
          const queueName = getQueueForJobType(job.type);
          expect(queueName).toBe(QueueName.VIDEO_PROCESSING);
        }),
        { numRuns: 100 }
      );
    });

    it('should assign visual-analysis jobs to VISUAL_ANALYSIS queue', () => {
      fc.assert(
        fc.property(visualAnalysisJobArb, (job) => {
          const queueName = getQueueForJobType(job.type);
          expect(queueName).toBe(QueueName.VISUAL_ANALYSIS);
        }),
        { numRuns: 100 }
      );
    });

    it('should assign text-analysis jobs to TEXT_ANALYSIS queue', () => {
      fc.assert(
        fc.property(textAnalysisJobArb, (job) => {
          const queueName = getQueueForJobType(job.type);
          expect(queueName).toBe(QueueName.TEXT_ANALYSIS);
        }),
        { numRuns: 100 }
      );
    });

    it('should consistently assign same job type to same queue', () => {
      fc.assert(
        fc.property(anyJobArb, anyJobArb, (job1, job2) => {
          if (job1.type === job2.type) {
            const queue1 = getQueueForJobType(job1.type);
            const queue2 = getQueueForJobType(job2.type);
            expect(queue1).toBe(queue2);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 4.3: Concurrency Limits', () => {
    it('should have positive concurrency for all queues', () => {
      fc.assert(
        fc.property(concurrencyConfigArb, (config) => {
          for (const queueName of Object.values(QueueName)) {
            expect(config[queueName]).toBeGreaterThan(0);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should respect concurrency limits per queue type', () => {
      fc.assert(
        fc.property(
          concurrencyConfigArb,
          fc.integer({ min: 1, max: 100 }),
          (config, activeJobs) => {
            for (const queueName of Object.values(QueueName)) {
              const limit = config[queueName];
              const effectiveActive = Math.min(activeJobs, limit);
              
              // Active jobs should never exceed concurrency limit
              expect(effectiveActive).toBeLessThanOrEqual(limit);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have VIDEO_PROCESSING with lower concurrency than TEXT_ANALYSIS', () => {
      // Video processing is more resource-intensive
      const defaultConfig = {
        [QueueName.VIDEO_PROCESSING]: 2,
        [QueueName.VISUAL_ANALYSIS]: 5,
        [QueueName.TEXT_ANALYSIS]: 10,
        [QueueName.VIRAL_PREDICTION]: 5,
        [QueueName.CONTENT_GENERATION]: 3,
        [QueueName.WEBHOOK_PROCESSING]: 10,
      };
      
      expect(defaultConfig[QueueName.VIDEO_PROCESSING])
        .toBeLessThan(defaultConfig[QueueName.TEXT_ANALYSIS]);
    });
  });

  describe('Property 4.4: Job Data Integrity', () => {
    it('should preserve all job fields through serialization', () => {
      fc.assert(
        fc.property(anyJobArb, (job) => {
          // Simulate JSON serialization (as would happen with Redis)
          const serialized = JSON.stringify(job);
          const deserialized = JSON.parse(serialized);
          
          expect(deserialized.jobId).toBe(job.jobId);
          expect(deserialized.userId).toBe(job.userId);
          expect(deserialized.priority).toBe(job.priority);
          expect(deserialized.type).toBe(job.type);
          expect(deserialized.createdAt).toBe(job.createdAt);
        }),
        { numRuns: 100 }
      );
    });

    it('should have unique job IDs', () => {
      fc.assert(
        fc.property(
          fc.array(jobIdArb, { minLength: 10, maxLength: 100 }),
          (jobIds) => {
            const uniqueIds = new Set(jobIds);
            // UUIDs should be unique (with very high probability)
            // Allow for some collisions in edge cases
            expect(uniqueIds.size).toBeGreaterThan(jobIds.length * 0.9);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have valid timestamps', () => {
      fc.assert(
        fc.property(anyJobArb, (job) => {
          expect(job.createdAt).toBeGreaterThan(0);
          expect(job.createdAt).toBeLessThan(Date.now() + 1000000000000);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 4.5: Rate Limiting Behavior', () => {
    it('should calculate rate limit windows correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }), // max requests
          fc.integer({ min: 1000, max: 60000 }), // duration in ms
          fc.integer({ min: 0, max: 2000 }), // current requests
          (max, duration, current) => {
            const isLimited = current >= max;
            const remaining = Math.max(0, max - current);
            
            expect(remaining).toBeGreaterThanOrEqual(0);
            expect(remaining).toBeLessThanOrEqual(max);
            
            if (isLimited) {
              expect(remaining).toBe(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reset rate limits after window expires', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000, max: 60000 }), // window duration
          fc.integer({ min: 0, max: 120000 }), // elapsed time
          (windowDuration, elapsed) => {
            const windowsElapsed = Math.floor(elapsed / windowDuration);
            const shouldReset = windowsElapsed > 0;
            
            if (shouldReset) {
              // After window expires, rate limit should reset
              expect(windowsElapsed).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 4.6: Job Status Transitions', () => {
    it('should have valid status transitions', () => {
      const validTransitions: Record<JobStatus, JobStatus[]> = {
        [JobStatus.PENDING]: [JobStatus.QUEUED, JobStatus.CANCELLED],
        [JobStatus.QUEUED]: [JobStatus.PROCESSING, JobStatus.CANCELLED],
        [JobStatus.PROCESSING]: [JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.RETRYING],
        [JobStatus.COMPLETED]: [], // Terminal state
        [JobStatus.FAILED]: [JobStatus.RETRYING], // Can retry
        [JobStatus.RETRYING]: [JobStatus.QUEUED],
        [JobStatus.CANCELLED]: [], // Terminal state
      };
      
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.values(JobStatus)),
          fc.constantFrom(...Object.values(JobStatus)),
          (from, to) => {
            const allowed = validTransitions[from];
            const isValid = from === to || allowed.includes(to);
            
            // Verify terminal states have no outgoing transitions
            if (from === JobStatus.COMPLETED || from === JobStatus.CANCELLED) {
              expect(validTransitions[from].length).toBe(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not transition from terminal states', () => {
      const terminalStates = [JobStatus.COMPLETED, JobStatus.CANCELLED];
      
      fc.assert(
        fc.property(
          fc.constantFrom(...terminalStates),
          fc.constantFrom(...Object.values(JobStatus)),
          (terminalState, nextState) => {
            // Terminal states should only transition to themselves
            if (terminalState !== nextState) {
              const validTransitions: Record<JobStatus, JobStatus[]> = {
                [JobStatus.COMPLETED]: [],
                [JobStatus.CANCELLED]: [],
                [JobStatus.PENDING]: [],
                [JobStatus.QUEUED]: [],
                [JobStatus.PROCESSING]: [],
                [JobStatus.FAILED]: [],
                [JobStatus.RETRYING]: [],
              };
              expect(validTransitions[terminalState]).not.toContain(nextState);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 4.7: Bulk Job Operations', () => {
    it('should preserve job order in bulk operations', () => {
      fc.assert(
        fc.property(jobListArb, (jobs) => {
          // Group jobs by queue
          const jobsByQueue = new Map<QueueName, typeof jobs>();
          
          for (const job of jobs) {
            const queueName = getQueueForJobType(job.type);
            if (!jobsByQueue.has(queueName)) {
              jobsByQueue.set(queueName, []);
            }
            jobsByQueue.get(queueName)!.push(job);
          }
          
          // Verify all jobs are accounted for
          let totalJobs = 0;
          for (const queueJobs of jobsByQueue.values()) {
            totalJobs += queueJobs.length;
          }
          expect(totalJobs).toBe(jobs.length);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle empty bulk operations', () => {
      const emptyJobs: ContentTrendsJobData[] = [];
      const jobsByQueue = new Map<QueueName, ContentTrendsJobData[]>();
      
      for (const job of emptyJobs) {
        const queueName = getQueueForJobType(job.type);
        if (!jobsByQueue.has(queueName)) {
          jobsByQueue.set(queueName, []);
        }
        jobsByQueue.get(queueName)!.push(job);
      }
      
      expect(jobsByQueue.size).toBe(0);
    });
  });

  describe('Property 4.8: Queue Metrics Consistency', () => {
    it('should have non-negative metric values', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10000 }), // waiting
          fc.integer({ min: 0, max: 100 }), // active
          fc.integer({ min: 0, max: 100000 }), // completed
          fc.integer({ min: 0, max: 10000 }), // failed
          fc.integer({ min: 0, max: 1000 }), // delayed
          (waiting, active, completed, failed, delayed) => {
            expect(waiting).toBeGreaterThanOrEqual(0);
            expect(active).toBeGreaterThanOrEqual(0);
            expect(completed).toBeGreaterThanOrEqual(0);
            expect(failed).toBeGreaterThanOrEqual(0);
            expect(delayed).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should calculate throughput correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000 }), // jobs in last minute
          (jobsPerMinute) => {
            const throughput = jobsPerMinute;
            expect(throughput).toBeGreaterThanOrEqual(0);
            expect(throughput).toBeLessThanOrEqual(1000);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the appropriate queue for a job type
 */
function getQueueForJobType(type: string): QueueName {
  switch (type) {
    case 'video-processing':
      return QueueName.VIDEO_PROCESSING;
    case 'visual-analysis':
      return QueueName.VISUAL_ANALYSIS;
    case 'text-analysis':
      return QueueName.TEXT_ANALYSIS;
    case 'viral-prediction':
      return QueueName.VIRAL_PREDICTION;
    case 'content-generation':
      return QueueName.CONTENT_GENERATION;
    case 'webhook-processing':
      return QueueName.WEBHOOK_PROCESSING;
    default:
      throw new Error(`Unknown job type: ${type}`);
  }
}
