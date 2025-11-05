#!/usr/bin/env node

/**
 * Game Days Setup Script
 * Initialize Game Day scenarios and configuration
 */

const fs = require('fs').promises;
const path = require('path');

const SCENARIOS_DIR = path.join(process.cwd(), 'scenarios');
const CONFIG_FILE = path.join(process.cwd(), 'game-days.config.json');

// Default Game Day configuration
const defaultConfig = {
  enabled: true,
  safetyMode: true,
  environments: {
    development: {
      enabled: true,
      maxConcurrentFailures: 2,
      blastRadiusLimit: 'LIMITED'
    },
    staging: {
      enabled: true,
      maxConcurrentFailures: 3,
      blastRadiusLimit: 'MODERATE'
    },
    production: {
      enabled: false,
      maxConcurrentFailures: 1,
      blastRadiusLimit: 'MINIMAL'
    }
  },
  schedules: {
    monthly: {
      enabled: true,
      dayOfMonth: 15,
      duration: 120, // minutes
      scenarios: ['database-failure', 'network-partition', 'service-outage']
    },
    quarterly: {
      enabled: true,
      month: [3, 6, 9, 12],
      dayOfMonth: 1,
      duration: 240, // minutes
      scenarios: ['regional-outage', 'security-incident', 'vendor-failure']
    },
    annual: {
      enabled: true,
      month: 11,
      dayOfMonth: 15,
      duration: 480, // minutes
      scenarios: ['catastrophic-failure', 'business-continuity']
    }
  },
  notifications: {
    slack: {
      enabled: false,
      webhook: process.env.SLACK_WEBHOOK_URL
    },
    email: {
      enabled: true,
      recipients: ['sre-team@company.com', 'engineering-leads@company.com']
    }
  },
  metrics: {
    targets: {
      detectionTime: 60, // seconds
      responseTime: 30,  // seconds
      recoveryTime: 120, // seconds
      dataLossLimit: 300 // seconds
    },
    retention: {
      executions: 90,    // days
      metrics: 365,      // days
      logs: 30          // days
    }
  }
};

// Monthly tactical scenarios
const monthlyScenarios = [
  {
    id: 'database-primary-failure',
    name: 'Primary Database Failure',
    type: 'MONTHLY_TACTICAL',
    description: 'Simulate primary database failure to test failover procedures',
    duration: 60,
    complexity: 'MEDIUM',
    prerequisites: [
      'Database replica is healthy',
      'Monitoring is operational',
      'Team is available'
    ],
    objectives: [
      'Validate automatic failover to replica',
      'Test application reconnection logic',
      'Verify data consistency post-failover'
    ],
    successCriteria: {
      detectionTime: 30,
      responseTime: 15,
      recoveryTime: 60,
      dataLossLimit: 0,
      alertAccuracy: 95,
      runbookCompliance: 90
    },
    safetyControls: {
      maxDuration: 90,
      stopConditions: ['Data corruption detected', 'Customer impact > 10%'],
      blastRadius: 'LIMITED',
      rollbackProcedure: 'Restore primary database from backup',
      emergencyContacts: ['dba-oncall@company.com'],
      monitoringAmplification: true
    },
    steps: [
      {
        id: 'prep-1',
        name: 'Verify System Health',
        description: 'Confirm all systems are healthy before starting',
        type: 'PREPARATION',
        duration: 5,
        automated: true,
        command: 'health-check --all',
        expectedOutcome: 'All systems report healthy',
        validationCriteria: ['Database responsive', 'Application healthy'],
        dependencies: []
      },
      {
        id: 'inject-1',
        name: 'Terminate Primary Database',
        description: 'Stop primary database to trigger failover',
        type: 'INJECTION',
        duration: 1,
        automated: true,
        command: 'chaos-inject database-failure --target primary',
        expectedOutcome: 'Primary database becomes unavailable',
        validationCriteria: ['Connection failures detected', 'Alerts fired'],
        dependencies: ['prep-1']
      },
      {
        id: 'observe-1',
        name: 'Monitor Failover',
        description: 'Observe automatic failover to replica',
        type: 'OBSERVATION',
        duration: 15,
        automated: false,
        expectedOutcome: 'Application fails over to replica database',
        validationCriteria: ['Replica promoted', 'Application reconnected'],
        dependencies: ['inject-1']
      },
      {
        id: 'recover-1',
        name: 'Restore Primary',
        description: 'Bring primary database back online',
        type: 'RECOVERY',
        duration: 30,
        automated: true,
        command: 'chaos-recover database-failure --target primary',
        expectedOutcome: 'Primary database restored and synchronized',
        validationCriteria: ['Primary online', 'Data synchronized'],
        dependencies: ['observe-1']
      },
      {
        id: 'validate-1',
        name: 'Verify Full Recovery',
        description: 'Confirm system is fully operational',
        type: 'VALIDATION',
        duration: 10,
        automated: true,
        command: 'health-check --comprehensive',
        expectedOutcome: 'All systems fully operational',
        validationCriteria: ['No data loss', 'Performance normal'],
        dependencies: ['recover-1']
      }
    ],
    roles: [
      {
        name: 'Game Master',
        responsibilities: ['Scenario execution', 'Safety monitoring', 'Communication'],
        requiredSkills: ['Game Day procedures', 'Incident management'],
        contactInfo: 'gamemaster@company.com',
        backupPersonnel: ['sre-lead@company.com']
      },
      {
        name: 'Database Administrator',
        responsibilities: ['Database monitoring', 'Failover validation', 'Data integrity'],
        requiredSkills: ['Database administration', 'Replication management'],
        contactInfo: 'dba@company.com',
        backupPersonnel: ['senior-dba@company.com']
      }
    ],
    environment: 'STAGING'
  },
  {
    id: 'network-partition-services',
    name: 'Service Network Partition',
    type: 'MONTHLY_TACTICAL',
    description: 'Create network partition between critical services',
    duration: 45,
    complexity: 'MEDIUM',
    prerequisites: [
      'Service mesh is operational',
      'Circuit breakers configured',
      'Monitoring dashboards ready'
    ],
    objectives: [
      'Test service mesh resilience',
      'Validate circuit breaker behavior',
      'Verify graceful degradation'
    ],
    successCriteria: {
      detectionTime: 45,
      responseTime: 20,
      recoveryTime: 90,
      dataLossLimit: 0,
      alertAccuracy: 90,
      runbookCompliance: 85
    },
    safetyControls: {
      maxDuration: 60,
      stopConditions: ['Circuit breakers not opening', 'Cascade failures'],
      blastRadius: 'MODERATE',
      rollbackProcedure: 'Restore network connectivity',
      emergencyContacts: ['network-team@company.com'],
      monitoringAmplification: true
    },
    steps: [
      {
        id: 'prep-2',
        name: 'Baseline Metrics',
        description: 'Capture baseline performance metrics',
        type: 'PREPARATION',
        duration: 5,
        automated: true,
        command: 'metrics-capture --baseline',
        expectedOutcome: 'Baseline metrics recorded',
        validationCriteria: ['All services responding', 'Normal latency'],
        dependencies: []
      },
      {
        id: 'inject-2',
        name: 'Create Network Partition',
        description: 'Block network traffic between services',
        type: 'INJECTION',
        duration: 1,
        automated: true,
        command: 'chaos-inject network-partition --services api,database',
        expectedOutcome: 'Network partition created',
        validationCriteria: ['Connection timeouts', 'Circuit breakers open'],
        dependencies: ['prep-2']
      },
      {
        id: 'observe-2',
        name: 'Monitor Service Behavior',
        description: 'Observe how services handle partition',
        type: 'OBSERVATION',
        duration: 20,
        automated: false,
        expectedOutcome: 'Services degrade gracefully',
        validationCriteria: ['Circuit breakers active', 'Fallback responses'],
        dependencies: ['inject-2']
      },
      {
        id: 'recover-2',
        name: 'Heal Network Partition',
        description: 'Restore network connectivity',
        type: 'RECOVERY',
        duration: 1,
        automated: true,
        command: 'chaos-recover network-partition --services api,database',
        expectedOutcome: 'Network connectivity restored',
        validationCriteria: ['Connections restored', 'Circuit breakers close'],
        dependencies: ['observe-2']
      },
      {
        id: 'validate-2',
        name: 'Verify Service Recovery',
        description: 'Confirm services return to normal',
        type: 'VALIDATION',
        duration: 15,
        automated: true,
        command: 'health-check --services --performance',
        expectedOutcome: 'All services fully recovered',
        validationCriteria: ['Normal response times', 'No errors'],
        dependencies: ['recover-2']
      }
    ],
    roles: [
      {
        name: 'Network Engineer',
        responsibilities: ['Network monitoring', 'Partition validation', 'Recovery'],
        requiredSkills: ['Network troubleshooting', 'Service mesh'],
        contactInfo: 'network@company.com',
        backupPersonnel: ['senior-network@company.com']
      },
      {
        name: 'Application Engineer',
        responsibilities: ['Service monitoring', 'Circuit breaker validation'],
        requiredSkills: ['Application architecture', 'Resilience patterns'],
        contactInfo: 'app-eng@company.com',
        backupPersonnel: ['senior-app-eng@company.com']
      }
    ],
    environment: 'STAGING'
  }
];

async function setupGameDays() {
  console.log('🎮 Setting up Game Days framework...\n');

  try {
    // Create scenarios directory
    await fs.mkdir(SCENARIOS_DIR, { recursive: true });
    await fs.mkdir(path.join(SCENARIOS_DIR, 'monthly'), { recursive: true });
    await fs.mkdir(path.join(SCENARIOS_DIR, 'quarterly'), { recursive: true });
    await fs.mkdir(path.join(SCENARIOS_DIR, 'annual'), { recursive: true });

    // Write configuration file
    await fs.writeFile(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
    console.log('✅ Created game-days.config.json');

    // Write monthly scenarios
    for (const scenario of monthlyScenarios) {
      const scenarioFile = path.join(SCENARIOS_DIR, 'monthly', `${scenario.id}.json`);
      await fs.writeFile(scenarioFile, JSON.stringify(scenario, null, 2));
      console.log(`✅ Created scenario: ${scenario.name}`);
    }

    // Create quarterly scenarios directory structure
    const quarterlyScenarios = ['regional-outage', 'security-incident', 'vendor-failure'];
    for (const scenarioId of quarterlyScenarios) {
      const scenarioFile = path.join(SCENARIOS_DIR, 'quarterly', `${scenarioId}.json`);
      const placeholder = {
        id: scenarioId,
        name: scenarioId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        type: 'QUARTERLY_STRATEGIC',
        description: `Quarterly strategic scenario: ${scenarioId}`,
        duration: 240,
        complexity: 'HIGH',
        environment: 'STAGING'
      };
      await fs.writeFile(scenarioFile, JSON.stringify(placeholder, null, 2));
      console.log(`✅ Created quarterly scenario placeholder: ${scenarioId}`);
    }

    // Create annual scenarios
    const annualScenarios = ['catastrophic-failure', 'business-continuity'];
    for (const scenarioId of annualScenarios) {
      const scenarioFile = path.join(SCENARIOS_DIR, 'annual', `${scenarioId}.json`);
      const placeholder = {
        id: scenarioId,
        name: scenarioId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        type: 'ANNUAL_DIRT_LITE',
        description: `Annual DiRT-lite scenario: ${scenarioId}`,
        duration: 480,
        complexity: 'CRITICAL',
        environment: 'PRODUCTION'
      };
      await fs.writeFile(scenarioFile, JSON.stringify(placeholder, null, 2));
      console.log(`✅ Created annual scenario placeholder: ${scenarioId}`);
    }

    console.log('\n🎯 Game Days setup complete!');
    console.log('\nNext steps:');
    console.log('1. Review and customize game-days.config.json');
    console.log('2. Complete quarterly and annual scenario definitions');
    console.log('3. Configure notification channels (Slack, email)');
    console.log('4. Schedule first monthly Game Day');
    console.log('5. Train team on Game Day procedures');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run setup if called directly
if (require.main === module) {
  setupGameDays();
}

module.exports = { setupGameDays, defaultConfig, monthlyScenarios };