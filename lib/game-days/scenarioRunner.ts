/**
 * Game Day Scenario Runner
 * Orchestrates disaster recovery testing scenarios with safety controls
 */

export enum ScenarioType {
  MONTHLY_TACTICAL = 'MONTHLY_TACTICAL',
  QUARTERLY_STRATEGIC = 'QUARTERLY_STRATEGIC',
  ANNUAL_DIRT_LITE = 'ANNUAL_DIRT_LITE',
  AD_HOC_DRILL = 'AD_HOC_DRILL'
}

export enum ScenarioStatus {
  PLANNED = 'PLANNED',
  PREPARING = 'PREPARING',
  EXECUTING = 'EXECUTING',
  RECOVERING = 'RECOVERING',
  COMPLETED = 'COMPLETED',
  ABORTED = 'ABORTED',
  FAILED = 'FAILED'
}

export interface GameDayScenario {
  id: string;
  name: string;
  type: ScenarioType;
  description: string;
  duration: number; // minutes
  complexity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  prerequisites: string[];
  objectives: string[];
  successCriteria: SuccessCriteria;
  safetyControls: SafetyControls;
  steps: ScenarioStep[];
  roles: GameDayRole[];
  environment: 'STAGING' | 'PRODUCTION' | 'ISOLATED';
}

export interface SuccessCriteria {
  detectionTime: number;    // seconds
  responseTime: number;     // seconds
  recoveryTime: number;     // seconds
  dataLossLimit: number;    // seconds
  alertAccuracy: number;    // percentage
  runbookCompliance: number; // percentage
}

export interface SafetyControls {
  maxDuration: number;      // minutes
  stopConditions: string[];
  blastRadius: 'MINIMAL' | 'LIMITED' | 'MODERATE' | 'EXTENSIVE';
  rollbackProcedure: string;
  emergencyContacts: string[];
  monitoringAmplification: boolean;
}

export interface ScenarioStep {
  id: string;
  name: string;
  description: string;
  type: 'PREPARATION' | 'INJECTION' | 'OBSERVATION' | 'RECOVERY' | 'VALIDATION';
  duration: number; // minutes
  automated: boolean;
  command?: string;
  expectedOutcome: string;
  validationCriteria: string[];
  dependencies: string[];
}

export interface GameDayRole {
  name: string;
  responsibilities: string[];
  requiredSkills: string[];
  contactInfo: string;
  backupPersonnel: string[];
}

export interface GameDayExecution {
  scenarioId: string;
  executionId: string;
  status: ScenarioStatus;
  startTime: number;
  endTime?: number;
  participants: GameDayParticipant[];
  metrics: GameDayMetrics;
  timeline: GameDayEvent[];
  observations: string[];
  issues: GameDayIssue[];
  actionItems: ActionItem[];
}

export interface GameDayParticipant {
  name: string;
  role: string;
  team: string;
  contactInfo: string;
  active: boolean;
}

export interface GameDayMetrics {
  detectionTime?: number;
  responseTime?: number;
  recoveryTime?: number;
  dataLoss?: number;
  alertsFired: number;
  alertsAccurate: number;
  runbookStepsFollowed: number;
  runbookStepsTotal: number;
  systemAvailability: number;
  userImpact: number;
}

export interface GameDayEvent {
  timestamp: number;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  source: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface GameDayIssue {
  id: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: 'TECHNICAL' | 'PROCESS' | 'COMMUNICATION' | 'DOCUMENTATION';
  description: string;
  impact: string;
  discoveredAt: number;
  resolvedAt?: number;
  resolution?: string;
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  category: 'RUNBOOK' | 'MONITORING' | 'PROCESS' | 'TRAINING' | 'TOOLING';
  assignee: string;
  dueDate: number;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}

class ScenarioRunner {
  private executions = new Map<string, GameDayExecution>();
  private scenarios = new Map<string, GameDayScenario>();

  async loadScenario(scenarioId: string): Promise<GameDayScenario> {
    // In production, this would load from a scenario repository
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) {
      throw new Error(`Scenario ${scenarioId} not found`);
    }
    return scenario;
  }

  async startGameDay(
    scenarioId: string,
    participants: GameDayParticipant[],
    options: {
      dryRun?: boolean;
      skipSafetyChecks?: boolean;
      customDuration?: number;
    } = {}
  ): Promise<string> {
    const scenario = await this.loadScenario(scenarioId);
    const executionId = this.generateExecutionId(scenarioId);

    // Validate prerequisites
    await this.validatePrerequisites(scenario);

    // Perform safety checks
    if (!options.skipSafetyChecks) {
      await this.performSafetyChecks(scenario);
    }

    // Create execution record
    const execution: GameDayExecution = {
      scenarioId,
      executionId,
      status: ScenarioStatus.PREPARING,
      startTime: Date.now(),
      participants,
      metrics: {
        alertsFired: 0,
        alertsAccurate: 0,
        runbookStepsFollowed: 0,
        runbookStepsTotal: scenario.steps.length,
        systemAvailability: 100,
        userImpact: 0
      },
      timeline: [],
      observations: [],
      issues: [],
      actionItems: []
    };

    this.executions.set(executionId, execution);

    // Log game day start
    this.logEvent(execution, 'INFO', 'SYSTEM', `Game Day started: ${scenario.name}`);

    // Start scenario execution
    await this.executeScenario(execution, scenario, options);

    return executionId;
  }

  private async executeScenario(
    execution: GameDayExecution,
    scenario: GameDayScenario,
    options: any
  ): Promise<void> {
    try {
      execution.status = ScenarioStatus.EXECUTING;
      this.logEvent(execution, 'INFO', 'SYSTEM', 'Scenario execution started');

      // Execute each step
      for (const step of scenario.steps) {
        await this.executeStep(execution, scenario, step, options.dryRun);

        // Check for abort conditions
        if (await this.shouldAbort(execution, scenario)) {
          await this.abortGameDay(execution.executionId, 'Safety condition triggered');
          return;
        }
      }

      // Mark as completed
      execution.status = ScenarioStatus.COMPLETED;
      execution.endTime = Date.now();
      this.logEvent(execution, 'SUCCESS', 'SYSTEM', 'Scenario completed successfully');

      // Calculate final metrics
      await this.calculateFinalMetrics(execution, scenario);

    } catch (error) {
      execution.status = ScenarioStatus.FAILED;
      execution.endTime = Date.now();
      this.logEvent(execution, 'ERROR', 'SYSTEM', `Scenario failed: ${error.message}`);
      throw error;
    }
  }

  private async executeStep(
    execution: GameDayExecution,
    scenario: GameDayScenario,
    step: ScenarioStep,
    dryRun: boolean = false
  ): Promise<void> {
    this.logEvent(execution, 'INFO', 'STEP', `Executing step: ${step.name}`);

    const stepStartTime = Date.now();

    try {
      if (step.automated && !dryRun) {
        await this.executeAutomatedStep(step);
      } else {
        // Manual step - wait for confirmation or timeout
        await this.waitForManualStep(execution, step);
      }

      // Validate step completion
      const validationResults = await this.validateStep(step);
      
      if (validationResults.success) {
        execution.metrics.runbookStepsFollowed++;
        this.logEvent(execution, 'SUCCESS', 'STEP', `Step completed: ${step.name}`);
      } else {
        this.logEvent(execution, 'WARNING', 'STEP', 
          `Step validation failed: ${step.name} - ${validationResults.reason}`);
        
        // Record issue
        execution.issues.push({
          id: this.generateId(),
          severity: 'MEDIUM',
          category: 'PROCESS',
          description: `Step validation failed: ${step.name}`,
          impact: validationResults.reason,
          discoveredAt: Date.now()
        });
      }

    } catch (error) {
      this.logEvent(execution, 'ERROR', 'STEP', `Step failed: ${step.name} - ${error.message}`);
      
      // Record critical issue
      execution.issues.push({
        id: this.generateId(),
        severity: 'HIGH',
        category: 'TECHNICAL',
        description: `Step execution failed: ${step.name}`,
        impact: error.message,
        discoveredAt: Date.now()
      });

      throw error;
    }
  }

  private async executeAutomatedStep(step: ScenarioStep): Promise<void> {
    if (!step.command) {
      throw new Error(`Automated step ${step.name} missing command`);
    }

    // Import chaos injector for failure injection
    const { chaosInjector } = await import('./chaosInjector');
    
    switch (step.type) {
      case 'INJECTION':
        await chaosInjector.injectFailure(step.command, step.duration * 60 * 1000);
        break;
      case 'RECOVERY':
        await chaosInjector.stopFailure(step.command);
        break;
      default:
        // Execute generic command
        await this.executeCommand(step.command);
    }
  }

  private async waitForManualStep(execution: GameDayExecution, step: ScenarioStep): Promise<void> {
    // In a real implementation, this would integrate with communication tools
    // For now, simulate manual step completion
    this.logEvent(execution, 'INFO', 'MANUAL', 
      `Manual step required: ${step.name} - ${step.description}`);
    
    // Simulate manual execution time
    await new Promise(resolve => setTimeout(resolve, step.duration * 60 * 1000 / 10)); // 10x faster for demo
  }

  private async validateStep(step: ScenarioStep): Promise<{ success: boolean; reason?: string }> {
    // Simulate step validation
    const success = Math.random() > 0.1; // 90% success rate
    
    return {
      success,
      reason: success ? undefined : 'Validation criteria not met'
    };
  }

  private async shouldAbort(execution: GameDayExecution, scenario: GameDayScenario): boolean {
    // Check time limits
    const elapsed = Date.now() - execution.startTime;
    if (elapsed > scenario.safetyControls.maxDuration * 60 * 1000) {
      return true;
    }

    // Check critical issues
    const criticalIssues = execution.issues.filter(i => i.severity === 'CRITICAL');
    if (criticalIssues.length > 0) {
      return true;
    }

    // Check system availability
    if (execution.metrics.systemAvailability < 50) {
      return true;
    }

    return false;
  }

  async abortGameDay(executionId: string, reason: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Execution ${executionId} not found`);
    }

    execution.status = ScenarioStatus.ABORTED;
    execution.endTime = Date.now();
    
    this.logEvent(execution, 'WARNING', 'SYSTEM', `Game Day aborted: ${reason}`);

    // Execute emergency rollback
    const scenario = await this.loadScenario(execution.scenarioId);
    await this.executeEmergencyRollback(scenario);
  }

  private async executeEmergencyRollback(scenario: GameDayScenario): Promise<void> {
    // Execute rollback procedure
    if (scenario.safetyControls.rollbackProcedure) {
      await this.executeCommand(scenario.safetyControls.rollbackProcedure);
    }

    // Stop all chaos injection
    const { chaosInjector } = await import('./chaosInjector');
    await chaosInjector.stopAllFailures();
  }

  private async calculateFinalMetrics(execution: GameDayExecution, scenario: GameDayScenario): Promise<void> {
    // Calculate detection time (time to first alert)
    const firstAlert = execution.timeline.find(e => e.type === 'WARNING' || e.type === 'ERROR');
    if (firstAlert) {
      execution.metrics.detectionTime = (firstAlert.timestamp - execution.startTime) / 1000;
    }

    // Calculate response time (time to first action)
    const firstAction = execution.timeline.find(e => e.source === 'MANUAL' || e.source === 'STEP');
    if (firstAction) {
      execution.metrics.responseTime = (firstAction.timestamp - execution.startTime) / 1000;
    }

    // Calculate recovery time (total duration)
    if (execution.endTime) {
      execution.metrics.recoveryTime = (execution.endTime - execution.startTime) / 1000;
    }

    // Calculate runbook compliance
    const compliance = (execution.metrics.runbookStepsFollowed / execution.metrics.runbookStepsTotal) * 100;
    
    // Generate action items based on performance
    await this.generateActionItems(execution, scenario);
  }

  private async generateActionItems(execution: GameDayExecution, scenario: GameDayScenario): Promise<void> {
    const { successCriteria } = scenario;
    
    // Check detection time
    if (execution.metrics.detectionTime && execution.metrics.detectionTime > successCriteria.detectionTime) {
      execution.actionItems.push({
        id: this.generateId(),
        title: 'Improve Alert Detection Time',
        description: `Detection took ${execution.metrics.detectionTime}s, target is ${successCriteria.detectionTime}s`,
        priority: 'HIGH',
        category: 'MONITORING',
        assignee: 'SRE Team',
        dueDate: Date.now() + (7 * 24 * 60 * 60 * 1000), // 1 week
        status: 'OPEN'
      });
    }

    // Check runbook compliance
    const compliance = (execution.metrics.runbookStepsFollowed / execution.metrics.runbookStepsTotal) * 100;
    if (compliance < successCriteria.runbookCompliance) {
      execution.actionItems.push({
        id: this.generateId(),
        title: 'Update Runbook Procedures',
        description: `Runbook compliance was ${compliance.toFixed(1)}%, target is ${successCriteria.runbookCompliance}%`,
        priority: 'MEDIUM',
        category: 'RUNBOOK',
        assignee: 'Operations Team',
        dueDate: Date.now() + (14 * 24 * 60 * 60 * 1000), // 2 weeks
        status: 'OPEN'
      });
    }

    // Check for recurring issues
    const technicalIssues = execution.issues.filter(i => i.category === 'TECHNICAL');
    if (technicalIssues.length > 2) {
      execution.actionItems.push({
        id: this.generateId(),
        title: 'Address Technical Issues',
        description: `${technicalIssues.length} technical issues identified during game day`,
        priority: 'HIGH',
        category: 'TOOLING',
        assignee: 'Development Team',
        dueDate: Date.now() + (10 * 24 * 60 * 60 * 1000), // 10 days
        status: 'OPEN'
      });
    }
  }

  private async validatePrerequisites(scenario: GameDayScenario): Promise<void> {
    // Validate system health
    const { healthChecker } = await import('@/lib/recovery/healthChecker');
    const systemHealth = await healthChecker.runAllChecks();
    
    if (systemHealth.status !== 'HEALTHY') {
      throw new Error('System health check failed - cannot start game day');
    }

    // Validate environment
    if (scenario.environment === 'PRODUCTION' && process.env.NODE_ENV !== 'production') {
      throw new Error('Production scenario requires production environment');
    }

    // Validate prerequisites
    for (const prerequisite of scenario.prerequisites) {
      // Check specific prerequisites (simplified for demo)
      console.log(`Validating prerequisite: ${prerequisite}`);
    }
  }

  private async performSafetyChecks(scenario: GameDayScenario): Promise<void> {
    // Check blast radius
    if (scenario.safetyControls.blastRadius === 'EXTENSIVE' && scenario.environment === 'PRODUCTION') {
      throw new Error('Extensive blast radius not allowed in production');
    }

    // Validate emergency contacts
    if (scenario.safetyControls.emergencyContacts.length === 0) {
      throw new Error('Emergency contacts required for game day');
    }

    // Check monitoring amplification
    if (scenario.safetyControls.monitoringAmplification) {
      // Enable enhanced monitoring
      console.log('Enhanced monitoring enabled for game day');
    }
  }

  private async executeCommand(command: string): Promise<void> {
    // In production, this would execute actual commands with proper safety controls
    console.log(`Executing command: ${command}`);
    
    // Simulate command execution
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  private logEvent(execution: GameDayExecution, type: GameDayEvent['type'], source: string, message: string): void {
    execution.timeline.push({
      timestamp: Date.now(),
      type,
      source,
      message
    });
  }

  private generateExecutionId(scenarioId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${scenarioId}-${timestamp}-${random}`;
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 10);
  }

  // Public API methods
  getExecution(executionId: string): GameDayExecution | undefined {
    return this.executions.get(executionId);
  }

  getAllExecutions(): GameDayExecution[] {
    return Array.from(this.executions.values());
  }

  getActiveExecutions(): GameDayExecution[] {
    return Array.from(this.executions.values()).filter(e => 
      [ScenarioStatus.PREPARING, ScenarioStatus.EXECUTING, ScenarioStatus.RECOVERING].includes(e.status)
    );
  }

  registerScenario(scenario: GameDayScenario): void {
    this.scenarios.set(scenario.id, scenario);
  }

  getScenario(scenarioId: string): GameDayScenario | undefined {
    return this.scenarios.get(scenarioId);
  }

  getAllScenarios(): GameDayScenario[] {
    return Array.from(this.scenarios.values());
  }
}

// Global instance
export const scenarioRunner = new ScenarioRunner();

// Convenience functions
export const startGameDay = (scenarioId: string, participants: GameDayParticipant[], options?: any) =>
  scenarioRunner.startGameDay(scenarioId, participants, options);

export const getGameDayExecution = (executionId: string) =>
  scenarioRunner.getExecution(executionId);

export const abortGameDay = (executionId: string, reason: string) =>
  scenarioRunner.abortGameDay(executionId, reason);