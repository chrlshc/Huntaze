/**
 * Deployment Monitoring System
 * Real-time deployment status tracking and health monitoring
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

class DeploymentMonitor {
  constructor(config = {}) {
    this.config = {
      checkInterval: config.checkInterval || 30000, // 30 seconds
      healthCheckTimeout: config.healthCheckTimeout || 10000, // 10 seconds
      maxRetries: config.maxRetries || 3,
      alertThreshold: config.alertThreshold || 5, // 5 failed checks
      metricsRetention: config.metricsRetention || 24 * 60 * 60 * 1000, // 24 hours
      ...config
    };
    
    this.deploymentStatus = {
      status: 'unknown',
      lastCheck: null,
      consecutiveFailures: 0,
      uptime: 0,
      startTime: Date.now()
    };
    
    this.metrics = {
      deployments: [],
      healthChecks: [],
      alerts: [],
      performance: []
    };
    
    this.isMonitoring = false;
    this.monitoringInterval = null;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  async startMonitoring(deploymentUrl) {
    if (this.isMonitoring) {
      this.log('Monitoring is already active', 'warning');
      return;
    }

    this.log('Starting deployment monitoring...', 'info');
    this.deploymentUrl = deploymentUrl;
    this.isMonitoring = true;
    this.deploymentStatus.startTime = Date.now();

    // Initial health check
    await this.performHealthCheck();

    // Start periodic monitoring
    this.monitoringInterval = setInterval(async () => {
      await this.performHealthCheck();
      this.updateMetrics();
      this.checkAlertConditions();
    }, this.config.checkInterval);

    this.log(`Monitoring started for: ${deploymentUrl}`, 'success');
  }

  stopMonitoring() {
    if (!this.isMonitoring) {
      this.log('Monitoring is not active', 'warning');
      return;
    }

    this.log('Stopping deployment monitoring...', 'info');
    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.generateMonitoringReport();
    this.log('Monitoring stopped', 'success');
  }

  async performHealthCheck() {
    const checkStartTime = Date.now();
    
    try {
      this.log('Performing health check...', 'info');
      
      // Basic connectivity check
      const connectivityResult = await this.checkConnectivity();
      
      // Application health check
      const appHealthResult = await this.checkApplicationHealth();
      
      // Performance metrics
      const performanceResult = await this.checkPerformanceMetrics();
      
      // Database connectivity (if applicable)
      const dbHealthResult = await this.checkDatabaseHealth();
      
      const checkDuration = Date.now() - checkStartTime;
      
      const healthCheckResult = {
        timestamp: new Date().toISOString(),
        duration: checkDuration,
        connectivity: connectivityResult,
        application: appHealthResult,
        performance: performanceResult,
        database: dbHealthResult,
        overall: this.calculateOverallHealth([
          connectivityResult,
          appHealthResult,
          performanceResult,
          dbHealthResult
        ])
      };

      this.metrics.healthChecks.push(healthCheckResult);
      this.updateDeploymentStatus(healthCheckResult.overall);
      
      if (healthCheckResult.overall.status === 'healthy') {
        this.log('Health check passed', 'success');
        this.deploymentStatus.consecutiveFailures = 0;
      } else {
        this.log(`Health check failed: ${healthCheckResult.overall.message}`, 'error');
        this.deploymentStatus.consecutiveFailures++;
      }

      return healthCheckResult;
      
    } catch (error) {
      this.log(`Health check error: ${error.message}`, 'error');
      this.deploymentStatus.consecutiveFailures++;
      
      const errorResult = {
        timestamp: new Date().toISOString(),
        duration: Date.now() - checkStartTime,
        error: error.message,
        overall: { status: 'unhealthy', message: error.message }
      };
      
      this.metrics.healthChecks.push(errorResult);
      this.updateDeploymentStatus(errorResult.overall);
      
      return errorResult;
    }
  }

  async checkConnectivity() {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      if (!this.deploymentUrl) {
        resolve({
          status: 'unknown',
          message: 'No deployment URL configured',
          responseTime: 0
        });
        return;
      }

      const request = https.get(this.deploymentUrl, {
        timeout: this.config.healthCheckTimeout
      }, (response) => {
        const responseTime = Date.now() - startTime;
        
        if (response.statusCode >= 200 && response.statusCode < 400) {
          resolve({
            status: 'healthy',
            statusCode: response.statusCode,
            responseTime,
            message: 'Connectivity check passed'
          });
        } else {
          resolve({
            status: 'unhealthy',
            statusCode: response.statusCode,
            responseTime,
            message: `HTTP ${response.statusCode}`
          });
        }
        
        response.resume(); // Consume response data
      });

      request.on('error', (error) => {
        const responseTime = Date.now() - startTime;
        resolve({
          status: 'unhealthy',
          responseTime,
          message: `Connection error: ${error.message}`
        });
      });

      request.on('timeout', () => {
        request.destroy();
        const responseTime = Date.now() - startTime;
        resolve({
          status: 'unhealthy',
          responseTime,
          message: 'Connection timeout'
        });
      });
    });
  }

  async checkApplicationHealth() {
    try {
      // Check for health endpoint
      const healthEndpoint = `${this.deploymentUrl}/api/health`;
      
      return new Promise((resolve) => {
        const startTime = Date.now();
        
        const request = https.get(healthEndpoint, {
          timeout: this.config.healthCheckTimeout
        }, (response) => {
          const responseTime = Date.now() - startTime;
          let data = '';
          
          response.on('data', chunk => {
            data += chunk;
          });
          
          response.on('end', () => {
            try {
              if (response.statusCode === 200) {
                const healthData = JSON.parse(data);
                resolve({
                  status: 'healthy',
                  responseTime,
                  data: healthData,
                  message: 'Application health check passed'
                });
              } else {
                resolve({
                  status: 'unhealthy',
                  statusCode: response.statusCode,
                  responseTime,
                  message: `Health endpoint returned ${response.statusCode}`
                });
              }
            } catch (parseError) {
              resolve({
                status: 'unhealthy',
                responseTime,
                message: 'Invalid health endpoint response'
              });
            }
          });
        });

        request.on('error', (error) => {
          const responseTime = Date.now() - startTime;
          resolve({
            status: 'degraded',
            responseTime,
            message: `Health endpoint not available: ${error.message}`
          });
        });

        request.on('timeout', () => {
          request.destroy();
          resolve({
            status: 'unhealthy',
            responseTime: Date.now() - startTime,
            message: 'Health endpoint timeout'
          });
        });
      });
      
    } catch (error) {
      return {
        status: 'unknown',
        message: `Application health check error: ${error.message}`
      };
    }
  }

  async checkPerformanceMetrics() {
    try {
      const startTime = Date.now();
      
      // Simulate performance check by measuring response time
      const performanceResult = await this.checkConnectivity();
      
      const responseTime = performanceResult.responseTime || 0;
      
      let status = 'healthy';
      let message = 'Performance within acceptable limits';
      
      if (responseTime > 5000) {
        status = 'unhealthy';
        message = 'Response time too slow (>5s)';
      } else if (responseTime > 2000) {
        status = 'degraded';
        message = 'Response time degraded (>2s)';
      }
      
      return {
        status,
        responseTime,
        message,
        metrics: {
          responseTime,
          timestamp: new Date().toISOString()
        }
      };
      
    } catch (error) {
      return {
        status: 'unknown',
        message: `Performance check error: ${error.message}`
      };
    }
  }

  async checkDatabaseHealth() {
    try {
      // Check database health endpoint if available
      const dbHealthEndpoint = `${this.deploymentUrl}/api/health/database`;
      
      return new Promise((resolve) => {
        const startTime = Date.now();
        
        const request = https.get(dbHealthEndpoint, {
          timeout: this.config.healthCheckTimeout
        }, (response) => {
          const responseTime = Date.now() - startTime;
          let data = '';
          
          response.on('data', chunk => {
            data += chunk;
          });
          
          response.on('end', () => {
            try {
              if (response.statusCode === 200) {
                const dbHealth = JSON.parse(data);
                resolve({
                  status: 'healthy',
                  responseTime,
                  data: dbHealth,
                  message: 'Database health check passed'
                });
              } else {
                resolve({
                  status: 'unhealthy',
                  statusCode: response.statusCode,
                  responseTime,
                  message: `Database health endpoint returned ${response.statusCode}`
                });
              }
            } catch (parseError) {
              resolve({
                status: 'unhealthy',
                responseTime,
                message: 'Invalid database health response'
              });
            }
          });
        });

        request.on('error', (error) => {
          resolve({
            status: 'unknown',
            responseTime: Date.now() - startTime,
            message: `Database health endpoint not available`
          });
        });

        request.on('timeout', () => {
          request.destroy();
          resolve({
            status: 'unknown',
            responseTime: Date.now() - startTime,
            message: 'Database health check timeout'
          });
        });
      });
      
    } catch (error) {
      return {
        status: 'unknown',
        message: `Database health check error: ${error.message}`
      };
    }
  }

  calculateOverallHealth(healthResults) {
    const validResults = healthResults.filter(result => result && result.status);
    
    if (validResults.length === 0) {
      return { status: 'unknown', message: 'No health data available' };
    }
    
    const unhealthyCount = validResults.filter(r => r.status === 'unhealthy').length;
    const degradedCount = validResults.filter(r => r.status === 'degraded').length;
    
    if (unhealthyCount > 0) {
      return {
        status: 'unhealthy',
        message: `${unhealthyCount} critical issues detected`
      };
    } else if (degradedCount > 0) {
      return {
        status: 'degraded',
        message: `${degradedCount} performance issues detected`
      };
    } else {
      return {
        status: 'healthy',
        message: 'All systems operational'
      };
    }
  }

  updateDeploymentStatus(overallHealth) {
    this.deploymentStatus.status = overallHealth.status;
    this.deploymentStatus.lastCheck = new Date().toISOString();
    this.deploymentStatus.uptime = Date.now() - this.deploymentStatus.startTime;
  }

  updateMetrics() {
    // Clean up old metrics
    const cutoffTime = Date.now() - this.config.metricsRetention;
    
    this.metrics.healthChecks = this.metrics.healthChecks.filter(
      check => new Date(check.timestamp).getTime() > cutoffTime
    );
    
    this.metrics.alerts = this.metrics.alerts.filter(
      alert => new Date(alert.timestamp).getTime() > cutoffTime
    );
  }

  checkAlertConditions() {
    // Check for consecutive failures
    if (this.deploymentStatus.consecutiveFailures >= this.config.alertThreshold) {
      this.generateAlert('CONSECUTIVE_FAILURES', {
        count: this.deploymentStatus.consecutiveFailures,
        threshold: this.config.alertThreshold,
        message: `${this.deploymentStatus.consecutiveFailures} consecutive health check failures`
      });
    }
    
    // Check for performance degradation
    const recentChecks = this.metrics.healthChecks.slice(-5);
    const avgResponseTime = recentChecks.reduce((sum, check) => {
      return sum + (check.connectivity?.responseTime || 0);
    }, 0) / recentChecks.length;
    
    if (avgResponseTime > 3000) {
      this.generateAlert('PERFORMANCE_DEGRADATION', {
        avgResponseTime,
        message: `Average response time degraded to ${Math.round(avgResponseTime)}ms`
      });
    }
  }

  generateAlert(type, details) {
    const alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity: this.getAlertSeverity(type),
      timestamp: new Date().toISOString(),
      details,
      resolved: false
    };
    
    this.metrics.alerts.push(alert);
    this.log(`ALERT [${alert.severity}]: ${alert.details.message}`, 'error');
    
    return alert;
  }

  getAlertSeverity(alertType) {
    const severityMap = {
      'CONSECUTIVE_FAILURES': 'HIGH',
      'PERFORMANCE_DEGRADATION': 'MEDIUM',
      'DATABASE_ISSUES': 'HIGH',
      'CONNECTIVITY_ISSUES': 'HIGH'
    };
    
    return severityMap[alertType] || 'LOW';
  }

  getStatus() {
    return {
      deployment: this.deploymentStatus,
      metrics: {
        totalHealthChecks: this.metrics.healthChecks.length,
        recentAlerts: this.metrics.alerts.filter(
          alert => !alert.resolved && 
          new Date(alert.timestamp).getTime() > Date.now() - (60 * 60 * 1000) // Last hour
        ).length,
        uptime: this.deploymentStatus.uptime,
        lastCheck: this.deploymentStatus.lastCheck
      },
      isMonitoring: this.isMonitoring
    };
  }

  generateMonitoringReport() {
    const report = {
      summary: {
        monitoringDuration: Date.now() - this.deploymentStatus.startTime,
        totalHealthChecks: this.metrics.healthChecks.length,
        totalAlerts: this.metrics.alerts.length,
        currentStatus: this.deploymentStatus.status,
        uptime: this.deploymentStatus.uptime
      },
      healthChecks: this.metrics.healthChecks,
      alerts: this.metrics.alerts,
      performance: this.calculatePerformanceStats(),
      recommendations: this.generateRecommendations()
    };

    const reportPath = path.join(process.cwd(), 'deployment-monitoring-report.json');
    
    try {
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      this.log(`Monitoring report saved to: ${reportPath}`, 'info');
    } catch (error) {
      this.log(`Could not save monitoring report: ${error.message}`, 'warning');
    }

    return report;
  }

  calculatePerformanceStats() {
    const healthChecks = this.metrics.healthChecks.filter(
      check => check.connectivity && check.connectivity.responseTime
    );
    
    if (healthChecks.length === 0) {
      return { message: 'No performance data available' };
    }
    
    const responseTimes = healthChecks.map(check => check.connectivity.responseTime);
    
    return {
      averageResponseTime: Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length),
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      totalChecks: healthChecks.length,
      successRate: Math.round((healthChecks.filter(check => 
        check.overall.status === 'healthy'
      ).length / healthChecks.length) * 100)
    };
  }

  generateRecommendations() {
    const recommendations = [];
    
    // Performance recommendations
    const perfStats = this.calculatePerformanceStats();
    if (perfStats.averageResponseTime > 2000) {
      recommendations.push({
        type: 'PERFORMANCE',
        priority: 'HIGH',
        message: 'Consider optimizing application performance - average response time is high',
        details: `Average response time: ${perfStats.averageResponseTime}ms`
      });
    }
    
    // Reliability recommendations
    const failureRate = this.deploymentStatus.consecutiveFailures;
    if (failureRate > 2) {
      recommendations.push({
        type: 'RELIABILITY',
        priority: 'HIGH',
        message: 'Investigate recurring deployment issues',
        details: `${failureRate} consecutive failures detected`
      });
    }
    
    // Monitoring recommendations
    if (this.metrics.healthChecks.length < 10) {
      recommendations.push({
        type: 'MONITORING',
        priority: 'MEDIUM',
        message: 'Consider running monitoring for longer periods to gather more data',
        details: `Only ${this.metrics.healthChecks.length} health checks performed`
      });
    }
    
    return recommendations;
  }
}

module.exports = DeploymentMonitor;

// CLI usage
if (require.main === module) {
  const deploymentUrl = process.argv[2];
  
  if (!deploymentUrl) {
    console.error('Usage: node deployment-monitor.js <deployment-url>');
    process.exit(1);
  }
  
  const monitor = new DeploymentMonitor();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down monitoring...');
    monitor.stopMonitoring();
    process.exit(0);
  });
  
  monitor.startMonitoring(deploymentUrl)
    .then(() => {
      console.log('Monitoring started. Press Ctrl+C to stop.');
    })
    .catch(error => {
      console.error('Failed to start monitoring:', error);
      process.exit(1);
    });
}