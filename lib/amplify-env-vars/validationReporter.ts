import { ValidationResult, EnvironmentVariable } from './interfaces';
import { Logger } from './logger';

/**
 * Validation reporting and caching system
 */
export class ValidationReporter {
  private static cache = new Map<string, CachedValidationResult>();
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Generate comprehensive validation report
   */
  static generateReport(
    formatResults: ValidationResult[],
    connectivityResults: ValidationResult[] = [],
    variables: EnvironmentVariable[] = []
  ): ValidationReport {
    const timestamp = new Date().toISOString();
    const summary = this.generateSummary(formatResults, connectivityResults);
    const categorizedResults = this.categorizeResults(formatResults, connectivityResults);
    const recommendations = this.generateRecommendations(categorizedResults);
    
    const report: ValidationReport = {
      timestamp,
      summary,
      formatValidation: {
        results: formatResults,
        summary: this.getValidationSummary(formatResults)
      },
      connectivityValidation: {
        results: connectivityResults,
        summary: this.getConnectivitySummary(connectivityResults)
      },
      categorizedResults,
      recommendations,
      variableDetails: this.generateVariableDetails(variables, formatResults, connectivityResults)
    };

    // Cache the report
    this.cacheReport(report);
    
    return report;
  }

  /**
   * Generate summary statistics
   */
  private static generateSummary(
    formatResults: ValidationResult[],
    connectivityResults: ValidationResult[]
  ): ValidationSummary {
    const allResults = [...formatResults, ...connectivityResults];
    
    const total = formatResults.length;
    const formatPassed = formatResults.filter(r => r.isValid).length;
    const connectivityTested = connectivityResults.length;
    const connectivityPassed = connectivityResults.filter(r => r.isValid).length;
    
    const errors = allResults.filter(r => r.severity === 'error').length;
    const warnings = allResults.filter(r => r.severity === 'warning').length;
    const infos = allResults.filter(r => r.severity === 'info').length;
    
    const overallScore = total > 0 ? Math.round((formatPassed / total) * 100) : 0;
    const connectivityScore = connectivityTested > 0 ? Math.round((connectivityPassed / connectivityTested) * 100) : 0;
    
    return {
      totalVariables: total,
      formatValidation: {
        passed: formatPassed,
        failed: total - formatPassed,
        score: overallScore
      },
      connectivityValidation: {
        tested: connectivityTested,
        passed: connectivityPassed,
        failed: connectivityTested - connectivityPassed,
        score: connectivityScore
      },
      severityBreakdown: {
        errors,
        warnings,
        infos
      },
      overallScore: Math.round((overallScore + connectivityScore) / 2)
    };
  }

  /**
   * Categorize results by severity and type
   */
  private static categorizeResults(
    formatResults: ValidationResult[],
    connectivityResults: ValidationResult[]
  ): CategorizedResults {
    const allResults = [...formatResults, ...connectivityResults];
    
    return {
      critical: allResults.filter(r => !r.isValid && r.severity === 'error'),
      warnings: allResults.filter(r => r.severity === 'warning'),
      passed: allResults.filter(r => r.isValid && r.severity === 'success'),
      info: allResults.filter(r => r.severity === 'info'),
      byVariable: this.groupByVariable(allResults)
    };
  }

  /**
   * Group results by variable name
   */
  private static groupByVariable(results: ValidationResult[]): Record<string, ValidationResult[]> {
    const grouped: Record<string, ValidationResult[]> = {};
    
    for (const result of results) {
      if (!grouped[result.variable]) {
        grouped[result.variable] = [];
      }
      grouped[result.variable].push(result);
    }
    
    return grouped;
  }

  /**
   * Generate actionable recommendations
   */
  private static generateRecommendations(categorized: CategorizedResults): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Critical issues
    if (categorized.critical.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'security',
        title: 'Fix Critical Validation Errors',
        description: `${categorized.critical.length} critical validation errors must be resolved before deployment.`,
        actions: categorized.critical.map(r => `Fix ${r.variable}: ${r.message}`),
        impact: 'Deployment may fail or application may not function correctly'
      });
    }

    // Security recommendations
    const securityIssues = categorized.critical.concat(categorized.warnings)
      .filter(r => r.variable.includes('SECRET') || r.variable.includes('KEY') || r.variable.includes('PASSWORD'));
    
    if (securityIssues.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'security',
        title: 'Address Security Configuration Issues',
        description: 'Security-related environment variables have validation issues.',
        actions: securityIssues.map(r => `Secure ${r.variable}: ${r.message}`),
        impact: 'Security vulnerabilities may be introduced'
      });
    }

    // Performance recommendations
    const connectivityIssues = categorized.critical.concat(categorized.warnings)
      .filter(r => r.message.includes('connectivity') || r.message.includes('reachable'));
    
    if (connectivityIssues.length > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'performance',
        title: 'Resolve Connectivity Issues',
        description: 'Some external services are not reachable.',
        actions: connectivityIssues.map(r => `Check ${r.variable}: ${r.message}`),
        impact: 'Application features may not work correctly'
      });
    }

    // Configuration recommendations
    if (categorized.warnings.length > 0) {
      recommendations.push({
        priority: 'low',
        category: 'configuration',
        title: 'Review Configuration Warnings',
        description: `${categorized.warnings.length} configuration warnings should be reviewed.`,
        actions: categorized.warnings.map(r => `Review ${r.variable}: ${r.message}`),
        impact: 'Potential configuration improvements available'
      });
    }

    return recommendations;
  }

  /**
   * Generate detailed variable information
   */
  private static generateVariableDetails(
    variables: EnvironmentVariable[],
    formatResults: ValidationResult[],
    connectivityResults: ValidationResult[]
  ): VariableDetail[] {
    const details: VariableDetail[] = [];
    
    for (const variable of variables) {
      const formatResult = formatResults.find(r => r.variable === variable.key);
      const connectivityResult = connectivityResults.find(r => r.variable === variable.key);
      
      details.push({
        name: variable.key,
        value: this.maskSensitiveValue(variable.key, variable.value),
        formatValidation: formatResult || null,
        connectivityTest: connectivityResult || null,
        status: this.determineVariableStatus(formatResult, connectivityResult),
        recommendations: this.getVariableRecommendations(variable.key, formatResult, connectivityResult)
      });
    }
    
    return details;
  }

  /**
   * Mask sensitive values for reporting
   */
  private static maskSensitiveValue(key: string, value: string): string {
    const sensitivePatterns = ['SECRET', 'KEY', 'PASSWORD', 'TOKEN', 'CREDENTIAL'];
    
    if (sensitivePatterns.some(pattern => key.includes(pattern))) {
      if (value.length <= 8) {
        return '*'.repeat(value.length);
      }
      return value.substring(0, 4) + '*'.repeat(value.length - 8) + value.substring(value.length - 4);
    }
    
    return value;
  }

  /**
   * Determine overall status for a variable
   */
  private static determineVariableStatus(
    formatResult?: ValidationResult | null,
    connectivityResult?: ValidationResult | null
  ): 'valid' | 'warning' | 'error' | 'unknown' {
    if (formatResult && !formatResult.isValid && formatResult.severity === 'error') {
      return 'error';
    }
    
    if (connectivityResult && !connectivityResult.isValid && connectivityResult.severity === 'error') {
      return 'error';
    }
    
    if ((formatResult && formatResult.severity === 'warning') || 
        (connectivityResult && connectivityResult.severity === 'warning')) {
      return 'warning';
    }
    
    if ((formatResult && formatResult.isValid) || (connectivityResult && connectivityResult.isValid)) {
      return 'valid';
    }
    
    return 'unknown';
  }

  /**
   * Get variable-specific recommendations
   */
  private static getVariableRecommendations(
    key: string,
    formatResult?: ValidationResult | null,
    connectivityResult?: ValidationResult | null
  ): string[] {
    const recommendations: string[] = [];
    
    if (formatResult && !formatResult.isValid) {
      recommendations.push(`Format: ${formatResult.message}`);
    }
    
    if (connectivityResult && !connectivityResult.isValid) {
      recommendations.push(`Connectivity: ${connectivityResult.message}`);
    }
    
    // Add specific recommendations based on variable type
    if (key === 'JWT_SECRET' && formatResult?.isValid) {
      recommendations.push('Consider rotating JWT secret regularly for security');
    }
    
    if (key === 'DATABASE_URL' && connectivityResult?.isValid) {
      recommendations.push('Ensure database connection pooling is configured');
    }
    
    return recommendations;
  }

  /**
   * Get validation summary from results
   */
  private static getValidationSummary(results: ValidationResult[]): {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
    errors: number;
  } {
    const total = results.length;
    const passed = results.filter(r => r.isValid).length;
    const failed = results.filter(r => !r.isValid).length;
    const warnings = results.filter(r => r.severity === 'warning').length;
    const errors = results.filter(r => r.severity === 'error').length;

    return { total, passed, failed, warnings, errors };
  }

  /**
   * Get connectivity summary from results
   */
  private static getConnectivitySummary(results: ValidationResult[]): {
    total: number;
    reachable: number;
    unreachable: number;
    untested: number;
    errors: number;
  } {
    const total = results.length;
    const reachable = results.filter(r => r.isValid && r.severity === 'success').length;
    const unreachable = results.filter(r => !r.isValid && r.severity === 'error').length;
    const untested = results.filter(r => r.severity === 'info').length;
    const errors = results.filter(r => r.severity === 'error').length;

    return { total, reachable, unreachable, untested, errors };
  }

  /**
   * Cache validation report
   */
  private static cacheReport(report: ValidationReport): void {
    const cacheKey = this.generateCacheKey(report);
    const cachedResult: CachedValidationResult = {
      report,
      timestamp: Date.now(),
      ttl: this.CACHE_TTL
    };
    
    this.cache.set(cacheKey, cachedResult);
    
    // Clean up expired cache entries
    this.cleanupCache();
  }

  /**
   * Get cached report if available and not expired
   */
  static getCachedReport(variables: EnvironmentVariable[]): ValidationReport | null {
    const cacheKey = this.generateCacheKey({ variableDetails: variables.map(v => ({ name: v.key })) } as any);
    const cached = this.cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < cached.ttl) {
      return cached.report;
    }
    
    return null;
  }

  /**
   * Generate cache key from report or variables
   */
  private static generateCacheKey(report: ValidationReport | { variableDetails: any[] }): string {
    const variableNames = report.variableDetails?.map(v => v.name).sort().join(',') || '';
    return `validation_${Buffer.from(variableNames).toString('base64')}`;
  }

  /**
   * Clean up expired cache entries
   */
  private static cleanupCache(): void {
    const now = Date.now();
    
    for (const [key, cached] of this.cache.entries()) {
      if ((now - cached.timestamp) >= cached.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Export report to different formats
   */
  static exportReport(report: ValidationReport, format: 'json' | 'yaml' | 'html' | 'csv'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(report, null, 2);
      
      case 'yaml':
        return this.toYaml(report);
      
      case 'html':
        return this.toHtml(report);
      
      case 'csv':
        return this.toCsv(report);
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Convert report to YAML format
   */
  private static toYaml(report: ValidationReport): string {
    // Simple YAML conversion (in a real implementation, use a YAML library)
    const yaml = [
      `timestamp: ${report.timestamp}`,
      `summary:`,
      `  totalVariables: ${report.summary.totalVariables}`,
      `  overallScore: ${report.summary.overallScore}`,
      `  formatValidation:`,
      `    passed: ${report.summary.formatValidation.passed}`,
      `    failed: ${report.summary.formatValidation.failed}`,
      `    score: ${report.summary.formatValidation.score}`,
      `recommendations:`,
      ...report.recommendations.map(r => `  - title: "${r.title}"`),
      ``
    ].join('\n');
    
    return yaml;
  }

  /**
   * Convert report to HTML format
   */
  private static toHtml(report: ValidationReport): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Environment Variables Validation Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; }
        .error { color: #d32f2f; }
        .warning { color: #f57c00; }
        .success { color: #388e3c; }
        .recommendation { margin: 10px 0; padding: 10px; border-left: 4px solid #2196f3; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>Environment Variables Validation Report</h1>
    <p><strong>Generated:</strong> ${report.timestamp}</p>
    
    <div class="summary">
        <h2>Summary</h2>
        <p><strong>Total Variables:</strong> ${report.summary.totalVariables}</p>
        <p><strong>Overall Score:</strong> ${report.summary.overallScore}%</p>
        <p><strong>Format Validation:</strong> ${report.summary.formatValidation.passed}/${report.summary.totalVariables} passed</p>
        <p><strong>Connectivity Tests:</strong> ${report.summary.connectivityValidation.passed}/${report.summary.connectivityValidation.tested} passed</p>
    </div>
    
    <h2>Recommendations</h2>
    ${report.recommendations.map(r => `
        <div class="recommendation">
            <h3>${r.title} (${r.priority} priority)</h3>
            <p>${r.description}</p>
            <ul>${r.actions.map(action => `<li>${action}</li>`).join('')}</ul>
        </div>
    `).join('')}
    
    <h2>Variable Details</h2>
    <table>
        <thead>
            <tr>
                <th>Variable</th>
                <th>Status</th>
                <th>Format Validation</th>
                <th>Connectivity Test</th>
            </tr>
        </thead>
        <tbody>
            ${report.variableDetails.map(v => `
                <tr>
                    <td>${v.name}</td>
                    <td class="${v.status}">${v.status}</td>
                    <td>${v.formatValidation?.message || 'N/A'}</td>
                    <td>${v.connectivityTest?.message || 'N/A'}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
</body>
</html>`;
  }

  /**
   * Convert report to CSV format
   */
  private static toCsv(report: ValidationReport): string {
    const headers = ['Variable', 'Status', 'Format Validation', 'Connectivity Test', 'Recommendations'];
    const rows = report.variableDetails.map(v => [
      v.name,
      v.status,
      v.formatValidation?.message || 'N/A',
      v.connectivityTest?.message || 'N/A',
      v.recommendations.join('; ')
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    return csvContent;
  }

  /**
   * Log validation report
   */
  static logReport(report: ValidationReport, level: 'info' | 'warn' | 'error' = 'info'): void {
    Logger.log(`Validation Report Generated - Score: ${report.summary.overallScore}%`, level);
    
    if (report.categorizedResults.critical.length > 0) {
      Logger.log(`Critical Issues: ${report.categorizedResults.critical.length}`, 'error');
    }
    
    if (report.categorizedResults.warnings.length > 0) {
      Logger.log(`Warnings: ${report.categorizedResults.warnings.length}`, 'warn');
    }
    
    Logger.log(`Recommendations: ${report.recommendations.length}`, 'info');
  }
}

// Type definitions for the validation report
interface ValidationReport {
  timestamp: string;
  summary: ValidationSummary;
  formatValidation: {
    results: ValidationResult[];
    summary: {
      total: number;
      passed: number;
      failed: number;
      warnings: number;
      errors: number;
    };
  };
  connectivityValidation: {
    results: ValidationResult[];
    summary: {
      total: number;
      reachable: number;
      unreachable: number;
      untested: number;
      errors: number;
    };
  };
  categorizedResults: CategorizedResults;
  recommendations: Recommendation[];
  variableDetails: VariableDetail[];
}

interface ValidationSummary {
  totalVariables: number;
  formatValidation: {
    passed: number;
    failed: number;
    score: number;
  };
  connectivityValidation: {
    tested: number;
    passed: number;
    failed: number;
    score: number;
  };
  severityBreakdown: {
    errors: number;
    warnings: number;
    infos: number;
  };
  overallScore: number;
}

interface CategorizedResults {
  critical: ValidationResult[];
  warnings: ValidationResult[];
  passed: ValidationResult[];
  info: ValidationResult[];
  byVariable: Record<string, ValidationResult[]>;
}

interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  category: 'security' | 'performance' | 'configuration';
  title: string;
  description: string;
  actions: string[];
  impact: string;
}

interface VariableDetail {
  name: string;
  value: string;
  formatValidation: ValidationResult | null;
  connectivityTest: ValidationResult | null;
  status: 'valid' | 'warning' | 'error' | 'unknown';
  recommendations: string[];
}

interface CachedValidationResult {
  report: ValidationReport;
  timestamp: number;
  ttl: number;
}