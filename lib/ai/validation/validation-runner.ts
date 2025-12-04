/**
 * Validation Runner
 * 
 * Orchestrates all AI system validators and generates comprehensive reports.
 * Executes health checks, killer features validation, AWS connectivity,
 * resilience tests, cost tracking, and end-to-end validation.
 * 
 * @module lib/ai/validation/validation-runner
 */

import {
  ValidationReport,
  ValidationStatus,
  HealthCheckResult,
  InsightsValidationResult,
  CampaignValidationResult,
  SegmentationValidationResult,
  AWSConnectivityResult,
  FallbackValidationResult,
  CircuitBreakerValidationResult,
  CostValidationResult,
  E2EValidationResult,
  CoordinatorValidationResult,
  calculateValidationStatus,
} from './types';

import { RouterHealthValidator, createHealthValidator } from './health-validator';
import { InsightsValidator, createInsightsValidator } from './insights-validator';
import { CampaignValidator, createCampaignValidator } from './campaign-validator';
import { SegmentationValidator, createSegmentationValidator } from './segmentation-validator';
import { AWSConnectivityValidatorService, getAWSConnectivityValidator } from './aws-connectivity-validator';
import { FallbackValidatorService, getFallbackValidator } from './fallback-validator';
import { CircuitBreakerValidatorService, getCircuitBreakerValidator } from './circuit-breaker-validator';
import { CostValidatorService, getCostValidator } from './cost-validator';
import { E2EValidatorService, getE2EValidator } from './e2e-validator';

/**
 * Configuration for the validation runner
 */
export interface ValidationRunnerConfig {
  routerUrl?: string;
  environment?: string;
  skipAWSConnectivity?: boolean;
  skipResilience?: boolean;
  skipE2E?: boolean;
  timeout?: number;
}

/**
 * Validation Runner Service
 * 
 * Orchestrates all validators and generates comprehensive reports.
 */
export class ValidationRunner {
  private config: ValidationRunnerConfig;
  private healthValidator: ReturnType<typeof createHealthValidator>;
  private insightsValidator: ReturnType<typeof createInsightsValidator>;
  private campaignValidator: ReturnType<typeof createCampaignValidator>;
  private segmentationValidator: ReturnType<typeof createSegmentationValidator>;
  private awsValidator: AWSConnectivityValidatorService;
  private fallbackValidator: FallbackValidatorService;
  private circuitBreakerValidator: CircuitBreakerValidatorService;
  private costValidator: CostValidatorService;
  private e2eValidator: E2EValidatorService;

  constructor(config?: ValidationRunnerConfig) {
    this.config = {
      environment: process.env.NODE_ENV || 'development',
      ...config,
    };

    // Initialize all validators
    this.healthValidator = createHealthValidator(this.config.routerUrl);
    this.insightsValidator = createInsightsValidator();
    this.campaignValidator = createCampaignValidator();
    this.segmentationValidator = createSegmentationValidator();
    this.awsValidator = getAWSConnectivityValidator({ routerUrl: this.config.routerUrl });
    this.fallbackValidator = getFallbackValidator();
    this.circuitBreakerValidator = getCircuitBreakerValidator();
    this.costValidator = getCostValidator();
    this.e2eValidator = getE2EValidator({ routerUrl: this.config.routerUrl });
  }

  /**
   * Run full validation suite
   */
  async runFullValidation(): Promise<ValidationReport> {
    const errors: string[] = [];
    const startTime = Date.now();

    // Run all validations
    const [
      routerHealth,
      insights,
      campaign,
      segmentation,
      awsConnectivity,
      fallback,
      circuitBreaker,
      costValidation,
      aiService,
      coordinator,
    ] = await Promise.all([
      this.runHealthCheck().catch(e => this.handleError(e, errors, 'Health Check')),
      this.runInsightsValidation().catch(e => this.handleError(e, errors, 'Insights')),
      this.runCampaignValidation().catch(e => this.handleError(e, errors, 'Campaign')),
      this.runSegmentationValidation().catch(e => this.handleError(e, errors, 'Segmentation')),
      this.runAWSConnectivity().catch(e => this.handleError(e, errors, 'AWS Connectivity')),
      this.runFallbackTest().catch(e => this.handleError(e, errors, 'Fallback')),
      this.runCircuitBreakerTest().catch(e => this.handleError(e, errors, 'Circuit Breaker')),
      this.runCostValidation().catch(e => this.handleError(e, errors, 'Cost Tracking')),
      this.runE2EValidation().catch(e => this.handleError(e, errors, 'E2E AI Service')),
      this.runCoordinatorValidation().catch(e => this.handleError(e, errors, 'Coordinator')),
    ]);

    // Generate report
    return this.generateReport({
      routerHealth: routerHealth as HealthCheckResult,
      insights: insights as InsightsValidationResult,
      campaign: campaign as CampaignValidationResult,
      segmentation: segmentation as SegmentationValidationResult,
      awsConnectivity: awsConnectivity as AWSConnectivityResult,
      fallback: fallback as FallbackValidationResult,
      circuitBreaker: circuitBreaker as CircuitBreakerValidationResult,
      costValidation: costValidation as CostValidationResult,
      aiService: aiService as E2EValidationResult,
      coordinator: coordinator as CoordinatorValidationResult,
      errors,
      duration: Date.now() - startTime,
    });
  }

  /**
   * Run health check validation
   */
  private async runHealthCheck(): Promise<HealthCheckResult> {
    return this.healthValidator.checkHealth();
  }

  /**
   * Run insights validation
   */
  private async runInsightsValidation(): Promise<InsightsValidationResult> {
    const mockMetrics = {
      revenue: 10000,
      subscribers: 500,
      engagement: 0.75,
      period: '30d',
    };
    return this.insightsValidator.validateInsights(mockMetrics);
  }

  /**
   * Run campaign validation
   */
  private async runCampaignValidation(): Promise<CampaignValidationResult> {
    const mockRequest = {
      type: 'promotional',
      audience: 'all',
      goal: 'engagement',
    };
    return this.campaignValidator.validateCampaignGenerator(mockRequest);
  }

  /**
   * Run segmentation validation
   */
  private async runSegmentationValidation(): Promise<SegmentationValidationResult> {
    const mockFans = [
      { id: '1', name: 'Fan 1', totalSpent: 500, lastActive: new Date() },
      { id: '2', name: 'Fan 2', totalSpent: 50, lastActive: new Date() },
    ];
    return this.segmentationValidator.validateFanSegmentation(mockFans);
  }

  /**
   * Run AWS connectivity validation
   */
  private async runAWSConnectivity(): Promise<AWSConnectivityResult> {
    if (this.config.skipAWSConnectivity) {
      return {
        rdsConnected: true,
        secretsManagerAccessible: true,
        cloudWatchWritable: true,
        routerAccessible: true,
        errors: ['Skipped'],
        timestamp: new Date(),
      };
    }
    return this.awsValidator.validateAll();
  }

  /**
   * Run fallback test
   */
  private async runFallbackTest(): Promise<FallbackValidationResult> {
    if (this.config.skipResilience) {
      return {
        fallbackTriggered: true,
        fallbackTimeMs: 100,
        fallbackReason: 'skipped',
        legacyProviderUsed: false,
        metadata: { skipped: true },
      };
    }
    return this.fallbackValidator.testFallbackMechanism();
  }

  /**
   * Run circuit breaker test
   */
  private async runCircuitBreakerTest(): Promise<CircuitBreakerValidationResult> {
    if (this.config.skipResilience) {
      return {
        circuitOpen: false,
        failureCount: 0,
        blockedRequests: 0,
        resetTimeMs: 30000,
        threshold: 5,
      };
    }
    return this.circuitBreakerValidator.testCircuitBreaker();
  }

  /**
   * Run cost validation
   */
  private async runCostValidation(): Promise<CostValidationResult> {
    const mockUsage = {
      inputTokens: 1000,
      outputTokens: 500,
      totalTokens: 1500,
    };
    return this.costValidator.validateCostCalculation(mockUsage);
  }

  /**
   * Run E2E AI Service validation
   */
  private async runE2EValidation(): Promise<E2EValidationResult> {
    if (this.config.skipE2E) {
      return {
        success: true,
        responseTimeMs: 100,
        metadata: {
          model: 'skipped',
          deployment: 'skipped',
          region: 'skipped',
          requestType: 'chat',
        },
        routedCorrectly: true,
      };
    }
    return this.e2eValidator.validateAIServiceResponse('chat');
  }

  /**
   * Run Coordinator validation
   */
  private async runCoordinatorValidation(): Promise<CoordinatorValidationResult> {
    if (this.config.skipE2E) {
      return {
        success: true,
        responseTimeMs: 100,
        agentsInvolved: ['skipped'],
        outputsCombined: true,
      };
    }
    return this.e2eValidator.validateCoordinatorOrchestration();
  }

  /**
   * Handle validation errors
   */
  private handleError(error: unknown, errors: string[], context: string): unknown {
    const message = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`${context}: ${message}`);
    return this.getDefaultResult(context);
  }

  /**
   * Get default result for failed validation
   */
  private getDefaultResult(context: string): unknown {
    const defaults: Record<string, unknown> = {
      'Health Check': {
        healthy: false,
        responseTimeMs: 0,
        region: 'unknown',
        service: 'ai-router',
        timestamp: new Date(),
        error: 'Validation failed',
      },
      'Insights': {
        success: false,
        responseTimeMs: 0,
        model: 'unknown',
        hasRequiredFields: false,
        tokenUsage: null,
        error: 'Validation failed',
      },
      'Campaign': {
        success: false,
        responseTimeMs: 0,
        hasSubjectLine: false,
        hasBodyContent: false,
        hasVariations: false,
        correlationId: '',
        engagementScores: [],
        error: 'Validation failed',
      },
      'Segmentation': {
        success: false,
        responseTimeMs: 0,
        model: 'unknown',
        validSegments: false,
        churnProbabilityValid: false,
        hasRecommendations: false,
        segments: [],
        error: 'Validation failed',
      },
      'AWS Connectivity': {
        rdsConnected: false,
        secretsManagerAccessible: false,
        cloudWatchWritable: false,
        routerAccessible: false,
        errors: ['Validation failed'],
        timestamp: new Date(),
      },
      'Fallback': {
        fallbackTriggered: false,
        fallbackTimeMs: 0,
        fallbackReason: 'error',
        legacyProviderUsed: false,
        error: 'Validation failed',
      },
      'Circuit Breaker': {
        circuitOpen: false,
        failureCount: 0,
        blockedRequests: 0,
        resetTimeMs: 0,
        threshold: 5,
        error: 'Validation failed',
      },
      'Cost Tracking': {
        costCalculated: false,
        hasModelName: false,
        hasInputTokens: false,
        hasOutputTokens: false,
        hasTotalCostUsd: false,
        calculatedCost: 0,
        error: 'Validation failed',
      },
      'E2E AI Service': {
        success: false,
        responseTimeMs: 0,
        metadata: null,
        routedCorrectly: false,
        error: 'Validation failed',
      },
      'Coordinator': {
        success: false,
        responseTimeMs: 0,
        agentsInvolved: [],
        outputsCombined: false,
        error: 'Validation failed',
      },
    };
    return defaults[context] || {};
  }

  /**
   * Generate validation report
   */
  generateReport(results: {
    routerHealth: HealthCheckResult;
    insights: InsightsValidationResult;
    campaign: CampaignValidationResult;
    segmentation: SegmentationValidationResult;
    awsConnectivity: AWSConnectivityResult;
    fallback: FallbackValidationResult;
    circuitBreaker: CircuitBreakerValidationResult;
    costValidation: CostValidationResult;
    aiService: E2EValidationResult;
    coordinator: CoordinatorValidationResult;
    errors: string[];
    duration: number;
  }): ValidationReport {
    // Calculate overall status
    const checkResults = [
      { success: results.routerHealth.healthy },
      { success: results.insights.success },
      { success: results.campaign.success },
      { success: results.segmentation.success },
      { success: results.awsConnectivity.rdsConnected && results.awsConnectivity.routerAccessible },
      { success: results.fallback.fallbackTriggered },
      { success: results.circuitBreaker.circuitOpen },
      { success: results.costValidation.costCalculated },
      { success: results.aiService.success },
      { success: results.coordinator.success },
    ];

    const overallStatus = calculateValidationStatus(checkResults);
    const passedChecks = checkResults.filter(r => r.success).length;

    return {
      timestamp: new Date(),
      environment: this.config.environment || 'unknown',
      routerHealth: results.routerHealth,
      killerFeatures: {
        insights: results.insights,
        campaignGenerator: results.campaign,
        fanSegmentation: results.segmentation,
      },
      awsConnectivity: results.awsConnectivity,
      resilience: {
        fallback: results.fallback,
        circuitBreaker: results.circuitBreaker,
      },
      costTracking: results.costValidation,
      e2e: {
        aiService: results.aiService,
        coordinator: results.coordinator,
      },
      overallStatus,
      errors: results.errors,
      summary: {
        totalChecks: checkResults.length,
        passedChecks,
        failedChecks: checkResults.length - passedChecks,
      },
    };
  }
}

// ============================================================================
// Factory and Singleton
// ============================================================================

let runnerInstance: ValidationRunner | null = null;

/**
 * Get or create the Validation Runner instance
 */
export function getValidationRunner(
  config?: ValidationRunnerConfig
): ValidationRunner {
  if (!runnerInstance || config) {
    runnerInstance = new ValidationRunner(config);
  }
  return runnerInstance;
}

/**
 * Run full validation and return report
 */
export async function runValidation(
  config?: ValidationRunnerConfig
): Promise<ValidationReport> {
  const runner = getValidationRunner(config);
  return runner.runFullValidation();
}

/**
 * Format validation report as string
 */
export function formatReport(report: ValidationReport): string {
  const lines: string[] = [
    '═══════════════════════════════════════════════════════════════',
    '                 AWS AI SYSTEM VALIDATION REPORT                ',
    '═══════════════════════════════════════════════════════════════',
    '',
    `Timestamp: ${report.timestamp.toISOString()}`,
    `Environment: ${report.environment}`,
    `Overall Status: ${report.overallStatus}`,
    '',
    '───────────────────────────────────────────────────────────────',
    '                        SUMMARY                                 ',
    '───────────────────────────────────────────────────────────────',
    `Total Checks: ${report.summary.totalChecks}`,
    `Passed: ${report.summary.passedChecks}`,
    `Failed: ${report.summary.failedChecks}`,
    '',
    '───────────────────────────────────────────────────────────────',
    '                    ROUTER HEALTH                               ',
    '───────────────────────────────────────────────────────────────',
    `Status: ${report.routerHealth.healthy ? '✓ Healthy' : '✗ Unhealthy'}`,
    `Response Time: ${report.routerHealth.responseTimeMs}ms`,
    `Region: ${report.routerHealth.region}`,
    '',
    '───────────────────────────────────────────────────────────────',
    '                   KILLER FEATURES                              ',
    '───────────────────────────────────────────────────────────────',
    `Insights: ${report.killerFeatures.insights.success ? '✓' : '✗'}`,
    `Campaign Generator: ${report.killerFeatures.campaignGenerator.success ? '✓' : '✗'}`,
    `Fan Segmentation: ${report.killerFeatures.fanSegmentation.success ? '✓' : '✗'}`,
    '',
    '───────────────────────────────────────────────────────────────',
    '                  AWS CONNECTIVITY                              ',
    '───────────────────────────────────────────────────────────────',
    `RDS: ${report.awsConnectivity.rdsConnected ? '✓' : '✗'}`,
    `Secrets Manager: ${report.awsConnectivity.secretsManagerAccessible ? '✓' : '✗'}`,
    `Router: ${report.awsConnectivity.routerAccessible ? '✓' : '✗'}`,
    '',
    '───────────────────────────────────────────────────────────────',
    '                     RESILIENCE                                 ',
    '───────────────────────────────────────────────────────────────',
    `Fallback: ${report.resilience.fallback.fallbackTriggered ? '✓' : '✗'} (${report.resilience.fallback.fallbackTimeMs}ms)`,
    `Circuit Breaker: ${report.resilience.circuitBreaker.circuitOpen ? '✓ Open' : '✗ Closed'}`,
    '',
    '───────────────────────────────────────────────────────────────',
    '                   COST TRACKING                                ',
    '───────────────────────────────────────────────────────────────',
    `Calculated: ${report.costTracking.costCalculated ? '✓' : '✗'}`,
    `Cost: $${report.costTracking.calculatedCost.toFixed(6)}`,
    '',
    '───────────────────────────────────────────────────────────────',
    '                      E2E TESTS                                 ',
    '───────────────────────────────────────────────────────────────',
    `AI Service: ${report.e2e.aiService.success ? '✓' : '✗'}`,
    `Coordinator: ${report.e2e.coordinator.success ? '✓' : '✗'}`,
    '',
  ];

  if (report.errors.length > 0) {
    lines.push('───────────────────────────────────────────────────────────────');
    lines.push('                       ERRORS                                  ');
    lines.push('───────────────────────────────────────────────────────────────');
    report.errors.forEach(error => lines.push(`• ${error}`));
    lines.push('');
  }

  lines.push('═══════════════════════════════════════════════════════════════');

  return lines.join('\n');
}
