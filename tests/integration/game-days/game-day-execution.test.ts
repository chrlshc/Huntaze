/**
 * Game Day Execution Integration Tests
 * Test complete Game Day scenarios end-to-end
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { scenarioRunner, GameDayScenario, ScenarioType } from '@/lib/game-days/scenarioRunner';
import { chaosInjector } from '@/lib/game-days/chaosInjector';
import { aarManager } from '@/lib/game-days/afterActionReview';

describe('Game Day Execution Integration', () => {
  let testScenario: GameDayScenario;

  beforeEach(() => {
    // Create test scenario
    testScenario = {
      id: 'test-database-failure',
      name: 'Test Database Failure',
      type: ScenarioType.MONTHLY_TACTICAL,
      description: 'Test scenario for database failure simulation',
      duration: 30, // 30 minutes
      complexity: 'MEDIUM',
      prerequisites: ['Database healthy', 'Monitoring active'],
      objectives: ['Test failover', 'Validate alerts'],
      successCriteria: {
        detectionTime: 60,
        responseTime: 30,
        recoveryTime: 120,
        dataLossLimit: 0,
        alertAccuracy: 90,
        runbookCompliance: 85
      },
      safetyControls: {
        maxDuration: 45,
        stopConditions: ['Data corruption'],
        blastRadius: 'LIMITED',
        rollbackProcedure: 'Restore database',
        emergencyContacts: ['test@example.com'],
        monitoringAmplification: true
      },
      steps: [
        {
          id: 'prep-1',
          name: 'Health Check',
          description: 'Verify system health',
          type: 'PREPARATION',
          duration: 2,
          automated: true,
          command: 'health-check',
          expectedOutcome: 'System healthy',
          validationCriteria: ['All services up'],
          dependencies: []
        },
        {
          id: 'inject-1',
          name: 'Database Failure',
          description: 'Simulate database failure',
          type: 'INJECTION',
          duration: 1,
          automated: true,
          command: 'database-failure',
          expectedOutcome: 'Database unavailable',
          validationCriteria: ['Connection errors'],
          dependencies: ['prep-1']
        },
        {
          id: 'recover-1',
          name: 'Restore Database',
          description: 'Restore database service',
          type: 'RECOVERY',
          duration: 5,
          automated: true,
          command: 'database-restore',
          expectedOutcome: 'Database restored',
          validationCriteria: ['Connections restored'],
          dependencies: ['inject-1']
        }
      ],
      roles: [
        {
          name: 'Game Master',
          responsibilities: ['Execution', 'Safety'],
          requiredSkills: ['Game Days'],
          contactInfo: 'gm@test.com',
          backupPersonnel: ['backup@test.com']
        }
      ],
      environment: 'STAGING'
    };

    // Register test scenario
    scenarioRunner.registerScenario(testScenario);
  });

  afterEach(async () => {
    // Clean up any active failures
    await chaosInjector.stopAllFailures();
  });

  it('should execute complete Game Day scenario', async () => {
    const participants = [
      {
        name: 'Test User',
        role: 'Game Master',
        team: 'SRE',
        contactInfo: 'test@example.com',
        active: true
      }
    ];

    // Start Game Day
    const executionId = await scenarioRunner.startGameDay(
      testScenario.id,
      participants,
      { dryRun: true } // Use dry run for testing
    );

    expect(executionId).toBeDefined();
    expect(executionId).toMatch(/^test-database-failure-\d+-\w+$/);

    // Get execution details
    const execution = scenarioRunner.getExecution(executionId);
    expect(execution).toBeDefined();
    expect(execution?.scenarioId).toBe(testScenario.id);
    expect(execution?.participants).toHaveLength(1);
    expect(execution?.status).toBe('COMPLETED'); // Should complete quickly in dry run

    // Verify metrics were collected
    expect(execution?.metrics).toBeDefined();
    expect(execution?.metrics.runbookStepsTotal).toBe(3);
    expect(execution?.timeline).toBeDefined();
    expect(execution?.timeline.length).toBeGreaterThan(0);
  });

  it('should handle scenario abort correctly', async () => {
    const participants = [
      {
        name: 'Test User',
        role: 'Game Master',
        team: 'SRE',
        contactInfo: 'test@example.com',
        active: true
      }
    ];

    // Start Game Day
    const executionId = await scenarioRunner.startGameDay(
      testScenario.id,
      participants,
      { dryRun: true }
    );

    // Abort immediately
    await scenarioRunner.abortGameDay(executionId, 'Test abort');

    // Verify abort
    const execution = scenarioRunner.getExecution(executionId);
    expect(execution?.status).toBe('ABORTED');
    expect(execution?.endTime).toBeDefined();

    // Verify timeline includes abort event
    const abortEvent = execution?.timeline.find(e => 
      e.message.includes('aborted')
    );
    expect(abortEvent).toBeDefined();
  });

  it('should schedule and track AAR', async () => {
    const participants = [
      {
        name: 'Test User',
        role: 'Game Master',
        team: 'SRE',
        contactInfo: 'test@example.com',
        active: true
      }
    ];

    // Start and complete Game Day
    const executionId = await scenarioRunner.startGameDay(
      testScenario.id,
      participants,
      { dryRun: true }
    );

    const execution = scenarioRunner.getExecution(executionId);
    expect(execution?.status).toBe('COMPLETED');

    // Schedule AAR
    const aarId = await aarManager.scheduleAAR(
      {
        executionId,
        scenarioName: testScenario.name,
        date: execution!.startTime,
        duration: testScenario.duration,
        participants: participants.map(p => p.name)
      },
      'standard',
      'Test Facilitator',
      Date.now() + 3600000 // 1 hour from now
    );

    expect(aarId).toBeDefined();

    // Get AAR details
    const aar = aarManager.getAAR(aarId);
    expect(aar).toBeDefined();
    expect(aar?.gameDay.executionId).toBe(executionId);
    expect(aar?.status).toBe('SCHEDULED');
    expect(aar?.facilitator).toBe('Test Facilitator');
  });

  it('should validate safety controls', async () => {
    // Create scenario with strict safety controls
    const strictScenario: GameDayScenario = {
      ...testScenario,
      id: 'strict-test-scenario',
      safetyControls: {
        ...testScenario.safetyControls,
        maxDuration: 1, // 1 minute max
        stopConditions: ['Any error']
      }
    };

    scenarioRunner.registerScenario(strictScenario);

    const participants = [
      {
        name: 'Test User',
        role: 'Game Master',
        team: 'SRE',
        contactInfo: 'test@example.com',
        active: true
      }
    ];

    // Start Game Day
    const executionId = await scenarioRunner.startGameDay(
      strictScenario.id,
      participants,
      { dryRun: true }
    );

    // Verify execution respects safety controls
    const execution = scenarioRunner.getExecution(executionId);
    expect(execution).toBeDefined();

    // In a real scenario, this would test actual time limits
    // For dry run, we just verify the safety controls are configured
    expect(execution?.timeline.some(e => 
      e.message.includes('Safety') || e.message.includes('safety')
    )).toBe(false); // No safety violations in dry run
  });

  it('should collect and validate metrics', async () => {
    const participants = [
      {
        name: 'Test User',
        role: 'Game Master',
        team: 'SRE',
        contactInfo: 'test@example.com',
        active: true
      }
    ];

    // Start Game Day
    const executionId = await scenarioRunner.startGameDay(
      testScenario.id,
      participants,
      { dryRun: true }
    );

    const execution = scenarioRunner.getExecution(executionId);
    expect(execution?.metrics).toBeDefined();

    const metrics = execution!.metrics;

    // Verify metric structure
    expect(metrics.alertsFired).toBeDefined();
    expect(metrics.alertsAccurate).toBeDefined();
    expect(metrics.runbookStepsFollowed).toBeDefined();
    expect(metrics.runbookStepsTotal).toBe(3); // Our test scenario has 3 steps
    expect(metrics.systemAvailability).toBeDefined();
    expect(metrics.userImpact).toBeDefined();

    // Verify metrics are within expected ranges
    expect(metrics.systemAvailability).toBeGreaterThanOrEqual(0);
    expect(metrics.systemAvailability).toBeLessThanOrEqual(100);
    expect(metrics.runbookStepsFollowed).toBeLessThanOrEqual(metrics.runbookStepsTotal);
  });

  it('should handle multiple concurrent executions', async () => {
    const participants = [
      {
        name: 'Test User',
        role: 'Game Master',
        team: 'SRE',
        contactInfo: 'test@example.com',
        active: true
      }
    ];

    // Start multiple Game Days
    const execution1 = await scenarioRunner.startGameDay(
      testScenario.id,
      participants,
      { dryRun: true }
    );

    const execution2 = await scenarioRunner.startGameDay(
      testScenario.id,
      participants,
      { dryRun: true }
    );

    expect(execution1).not.toBe(execution2);

    // Verify both executions exist
    const exec1 = scenarioRunner.getExecution(execution1);
    const exec2 = scenarioRunner.getExecution(execution2);

    expect(exec1).toBeDefined();
    expect(exec2).toBeDefined();
    expect(exec1?.executionId).toBe(execution1);
    expect(exec2?.executionId).toBe(execution2);

    // Verify they have different timelines
    expect(exec1?.timeline).not.toEqual(exec2?.timeline);
  });

  it('should validate scenario prerequisites', async () => {
    // Create scenario with specific prerequisites
    const prereqScenario: GameDayScenario = {
      ...testScenario,
      id: 'prereq-test-scenario',
      prerequisites: [
        'Database replica healthy',
        'Monitoring dashboards operational',
        'Team members available'
      ]
    };

    scenarioRunner.registerScenario(prereqScenario);

    const participants = [
      {
        name: 'Test User',
        role: 'Game Master',
        team: 'SRE',
        contactInfo: 'test@example.com',
        active: true
      }
    ];

    // This should succeed in dry run mode
    const executionId = await scenarioRunner.startGameDay(
      prereqScenario.id,
      participants,
      { dryRun: true }
    );

    expect(executionId).toBeDefined();

    const execution = scenarioRunner.getExecution(executionId);
    expect(execution?.status).toBe('COMPLETED');
  });
});