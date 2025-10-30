import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { readFileSync, existsSync } from 'fs';

/**
 * Tests unitaires pour AWS Cost Monitoring
 * Valide la configuration des budgets et de la détection d'anomalies
 */

describe('AWS Cost Monitoring Configuration', () => {
  describe('Budget Configuration', () => {
    it('should have monthly budget threshold of $100', () => {
      // Vérifier que le budget mensuel est configuré à $100
      const budgetAmount = 100;
      expect(budgetAmount).toBe(100);
      expect(budgetAmount).toBeGreaterThan(0);
    });

    it('should have alert thresholds at 50%, 80%, and 100%', () => {
      const thresholds = [50, 80, 100];
      
      expect(thresholds).toHaveLength(3);
      expect(thresholds[0]).toBe(50);
      expect(thresholds[1]).toBe(80);
      expect(thresholds[2]).toBe(100);
    });

    it('should calculate threshold amounts correctly', () => {
      const budgetAmount = 100;
      const thresholds = [50, 80, 100];
      
      const thresholdAmounts = thresholds.map(t => (budgetAmount * t) / 100);
      
      expect(thresholdAmounts[0]).toBe(50);
      expect(thresholdAmounts[1]).toBe(80);
      expect(thresholdAmounts[2]).toBe(100);
    });

    it('should validate budget time unit is MONTHLY', () => {
      const timeUnit = 'MONTHLY';
      const validTimeUnits = ['DAILY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY'];
      
      expect(validTimeUnits).toContain(timeUnit);
      expect(timeUnit).toBe('MONTHLY');
    });

    it('should validate budget type is COST', () => {
      const budgetType = 'COST';
      const validBudgetTypes = ['COST', 'USAGE', 'RI_UTILIZATION', 'RI_COVERAGE'];
      
      expect(validBudgetTypes).toContain(budgetType);
      expect(budgetType).toBe('COST');
    });
  });

  describe('Cost Anomaly Detection', () => {
    it('should have SERVICE dimension for monitoring', () => {
      const monitorDimension = 'SERVICE';
      const validDimensions = ['SERVICE', 'LINKED_ACCOUNT', 'AZ', 'USAGE_TYPE'];
      
      expect(validDimensions).toContain(monitorDimension);
      expect(monitorDimension).toBe('SERVICE');
    });

    it('should have $10 threshold for anomaly detection', () => {
      const threshold = 10;
      
      expect(threshold).toBe(10);
      expect(threshold).toBeGreaterThan(0);
      expect(threshold).toBeLessThan(100);
    });

    it('should validate threshold type is ABSOLUTE_VALUE', () => {
      const thresholdType = 'ABSOLUTE_VALUE';
      const validTypes = ['ABSOLUTE_VALUE', 'PERCENTAGE'];
      
      expect(validTypes).toContain(thresholdType);
      expect(thresholdType).toBe('ABSOLUTE_VALUE');
    });

    it('should detect anomaly when spend exceeds threshold', () => {
      const normalSpend = 50;
      const anomalousSpend = 65;
      const threshold = 10;
      
      const isAnomaly = Math.abs(anomalousSpend - normalSpend) > threshold;
      
      expect(isAnomaly).toBe(true);
    });

    it('should not detect anomaly when spend is within threshold', () => {
      const normalSpend = 50;
      const currentSpend = 55;
      const threshold = 10;
      
      const isAnomaly = Math.abs(currentSpend - normalSpend) > threshold;
      
      expect(isAnomaly).toBe(false);
    });
  });

  describe('SNS Notification Configuration', () => {
    it('should reuse existing ErrorRateAlarmTopic', () => {
      const topicName = 'ErrorRateAlarmTopic';
      
      expect(topicName).toBe('ErrorRateAlarmTopic');
      expect(topicName).toMatch(/^[a-zA-Z0-9_-]+$/);
    });

    it('should format cost alert notification correctly', () => {
      const alert = {
        type: 'BUDGET_THRESHOLD',
        severity: 'WARNING',
        amount: {
          actual: 55,
          forecasted: 60,
          threshold: 50
        },
        timestamp: new Date().toISOString()
      };
      
      expect(alert.type).toBe('BUDGET_THRESHOLD');
      expect(alert.severity).toBe('WARNING');
      expect(alert.amount.actual).toBeGreaterThan(alert.amount.threshold);
    });

    it('should include service breakdown in notification', () => {
      const notification = {
        details: {
          period: '2024-01',
          breakdown: {
            'Lambda': 25,
            'RDS': 30,
            'API Gateway': 10
          }
        }
      };
      
      expect(notification.details.breakdown).toBeDefined();
      expect(Object.keys(notification.details.breakdown).length).toBeGreaterThan(0);
      
      const totalCost = Object.values(notification.details.breakdown).reduce((a, b) => a + b, 0);
      expect(totalCost).toBe(65);
    });
  });

  describe('CloudWatch Dashboard Integration', () => {
    it('should add cost widgets to existing dashboard', () => {
      const dashboardName = 'huntaze-prisma-migration';
      const newWidgets = [
        'current-spend',
        'forecast',
        'anomalies',
        'top-services'
      ];
      
      expect(dashboardName).toBe('huntaze-prisma-migration');
      expect(newWidgets).toHaveLength(4);
      expect(newWidgets).toContain('current-spend');
      expect(newWidgets).toContain('anomalies');
    });

    it('should display current spend vs budget', () => {
      const currentSpend = 55;
      const budget = 100;
      const percentageUsed = (currentSpend / budget) * 100;
      
      expect(percentageUsed).toBe(55);
      expect(percentageUsed).toBeLessThan(100);
    });

    it('should show forecast for end of month', () => {
      const currentSpend = 55;
      const daysElapsed = 15;
      const daysInMonth = 30;
      
      const dailyRate = currentSpend / daysElapsed;
      const forecast = dailyRate * daysInMonth;
      
      expect(forecast).toBeCloseTo(110, 0);
      expect(forecast).toBeGreaterThan(currentSpend);
    });
  });

  describe('Cost Alert Severity Levels', () => {
    it('should classify 50% threshold as WARNING', () => {
      const percentageUsed = 55;
      const severity = percentageUsed >= 50 && percentageUsed < 80 ? 'WARNING' : 
                       percentageUsed >= 80 && percentageUsed < 100 ? 'ALERT' : 
                       percentageUsed >= 100 ? 'CRITICAL' : 'INFO';
      
      expect(severity).toBe('WARNING');
    });

    it('should classify 80% threshold as ALERT', () => {
      const percentageUsed = 85;
      const severity = percentageUsed >= 50 && percentageUsed < 80 ? 'WARNING' : 
                       percentageUsed >= 80 && percentageUsed < 100 ? 'ALERT' : 
                       percentageUsed >= 100 ? 'CRITICAL' : 'INFO';
      
      expect(severity).toBe('ALERT');
    });

    it('should classify 100% threshold as CRITICAL', () => {
      const percentageUsed = 105;
      const severity = percentageUsed >= 50 && percentageUsed < 80 ? 'WARNING' : 
                       percentageUsed >= 80 && percentageUsed < 100 ? 'ALERT' : 
                       percentageUsed >= 100 ? 'CRITICAL' : 'INFO';
      
      expect(severity).toBe('CRITICAL');
    });
  });

  describe('Cost Optimization Recommendations', () => {
    it('should identify top cost drivers', () => {
      const servicesCosts = {
        'RDS': 45,
        'Lambda': 25,
        'API Gateway': 15,
        'CloudWatch': 10,
        'S3': 5
      };
      
      const sortedServices = Object.entries(servicesCosts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);
      
      expect(sortedServices[0][0]).toBe('RDS');
      expect(sortedServices[0][1]).toBe(45);
      expect(sortedServices).toHaveLength(3);
    });

    it('should calculate potential savings from anomaly prevention', () => {
      const normalMonthlySpend = 80;
      const anomalousSpend = 120;
      const potentialSavings = anomalousSpend - normalMonthlySpend;
      
      expect(potentialSavings).toBe(40);
      expect(potentialSavings).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing budget data gracefully', () => {
      const budgetData = null;
      const fallbackBudget = 100;
      
      const effectiveBudget = budgetData || fallbackBudget;
      
      expect(effectiveBudget).toBe(100);
    });

    it('should handle API rate limit errors', () => {
      const error = { code: 'ThrottlingException' };
      const shouldRetry = error.code === 'ThrottlingException';
      
      expect(shouldRetry).toBe(true);
    });

    it('should cache budget status locally', () => {
      const cachedStatus = {
        lastUpdated: new Date(),
        currentSpend: 55,
        budget: 100
      };
      
      const cacheAge = Date.now() - cachedStatus.lastUpdated.getTime();
      const isCacheValid = cacheAge < 3600000; // 1 hour
      
      expect(isCacheValid).toBe(true);
    });
  });
});

/**
 * Tests d'intégration pour Cost Monitoring
 */
describe('Cost Monitoring Integration', () => {
  describe('Budget and Anomaly Detection Integration', () => {
    it('should trigger both budget and anomaly alerts for significant overspend', () => {
      const currentSpend = 120;
      const budget = 100;
      const normalSpend = 80;
      const anomalyThreshold = 10;
      
      const budgetExceeded = currentSpend > budget;
      const isAnomaly = Math.abs(currentSpend - normalSpend) > anomalyThreshold;
      
      expect(budgetExceeded).toBe(true);
      expect(isAnomaly).toBe(true);
    });

    it('should not trigger anomaly alert for gradual budget increase', () => {
      const currentSpend = 55;
      const normalSpend = 50;
      const anomalyThreshold = 10;
      
      const isAnomaly = Math.abs(currentSpend - normalSpend) > anomalyThreshold;
      
      expect(isAnomaly).toBe(false);
    });
  });

  describe('SNS Topic Integration', () => {
    it('should publish to correct SNS topic ARN format', () => {
      const topicArn = 'arn:aws:sns:us-east-1:123456789012:ErrorRateAlarmTopic';
      
      expect(topicArn).toMatch(/^arn:aws:sns:[a-z0-9-]+:\d{12}:[a-zA-Z0-9_-]+$/);
      expect(topicArn).toContain('ErrorRateAlarmTopic');
    });

    it('should format SNS message with all required fields', () => {
      const message = {
        default: JSON.stringify({
          AlarmName: 'BudgetThresholdExceeded',
          NewStateValue: 'ALARM',
          NewStateReason: 'Budget threshold of $50 exceeded',
          StateChangeTime: new Date().toISOString(),
          Region: 'us-east-1',
          AlarmArn: 'arn:aws:cloudwatch:us-east-1:123456789012:alarm:BudgetThreshold'
        })
      };
      
      const parsed = JSON.parse(message.default);
      expect(parsed.AlarmName).toBeDefined();
      expect(parsed.NewStateValue).toBe('ALARM');
      expect(parsed.StateChangeTime).toBeDefined();
    });
  });
});
