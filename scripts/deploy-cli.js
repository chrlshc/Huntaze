#!/usr/bin/env node

/**
 * Safe Deployments CLI Tool
 */

const http = require('http');

class DeploymentCLI {
  async deploy(serviceName, version, strategy = 'canary', options = {}) {
    console.log(`🚀 Starting ${strategy} deployment: ${serviceName}:${version}`);
    
    try {
      // Check error budget first
      const budgetCheck = await this.makeRequest('/api/deployments/status', {
        method: 'POST',
        body: JSON.stringify({
          action: 'check_error_budget',
          serviceName,
          deploymentType: options.critical ? 'critical' : 'normal'
        })
      });
      
      if (!budgetCheck.result.allowed) {
        console.log(`❌ Deployment blocked: ${budgetCheck.result.reason}`);
        console.log('💡 Recommendations:');
        budgetCheck.result.recommendations.forEach(rec => console.log(`   - ${rec}`));
        return false;
      }
      
      console.log(`✅ Error budget check passed: ${budgetCheck.result.reason}`);
      
      // Start deployment
      const deployment = await this.makeRequest('/api/deployments/status', {
        method: 'POST',
        body: JSON.stringify({
          action: strategy === 'canary' ? 'start_canary' : 'start_blue_green',
          config: {
            serviceName,
            version,
            ...options
          }
        })
      });
      
      if (deployment.success) {
        console.log(`✅ Deployment started: ${deployment.deploymentId}`);
        
        if (options.watch) {
          await this.watchDeployment(deployment.deploymentId, strategy);
        }
        
        return deployment.deploymentId;
      } else {
        console.log(`❌ Deployment failed to start: ${deployment.error}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Deployment error: ${error.message}`);
      return false;
    }
  }
  
  async rollback(deploymentId, reason = 'Manual rollback') {
    console.log(`⏪ Rolling back deployment: ${deploymentId}`);
    
    try {
      // Determine deployment type and rollback
      const status = await this.getDeploymentStatus();
      const deployment = this.findDeployment(status, deploymentId);
      
      if (!deployment) {
        console.log(`❌ Deployment not found: ${deploymentId}`);
        return false;
      }
      
      const action = deployment.type === 'canary' ? 'rollback_canary' : 'rollback_blue_green';
      
      const result = await this.makeRequest('/api/deployments/status', {
        method: 'POST',
        body: JSON.stringify({
          action,
          deploymentId,
          reason
        })
      });
      
      if (result.success) {
        console.log(`✅ Rollback completed: ${reason}`);
        return true;
      } else {
        console.log(`❌ Rollback failed: ${result.error}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Rollback error: ${error.message}`);
      return false;
    }
  }
  
  async status(serviceName) {
    try {
      const status = await this.getDeploymentStatus(serviceName);
      
      console.log('📊 Deployment System Status');
      console.log('=' .repeat(40));
      
      // Canary deployments
      console.log(`\n🐤 Canary Deployments: ${status.deployments.canary.total} total, ${status.deployments.canary.active} active`);
      if (status.deployments.canary.active > 0) {
        status.deployments.canary.deployments.forEach(d => {
          if (['STAGE_5', 'STAGE_25', 'STAGE_50', 'STAGE_100'].includes(d.stage)) {
            console.log(`   📈 ${d.config.serviceName}:${d.config.version} - ${d.stage} (${d.trafficPercentage}%)`);
          }
        });
      }
      
      // Blue-Green deployments
      console.log(`\n🔵🟢 Blue-Green Deployments: ${status.deployments.blueGreen.total} total, ${status.deployments.blueGreen.active} active`);
      if (status.deployments.blueGreen.active > 0) {
        status.deployments.blueGreen.deployments.forEach(d => {
          if (['DEPLOYING_GREEN', 'VALIDATING_GREEN', 'SWITCHING_TRAFFIC', 'MONITORING'].includes(d.stage)) {
            console.log(`   🔄 ${d.config.serviceName}:${d.config.version} - ${d.stage}`);
          }
        });
      }
      
      // Error budget status
      console.log(`\n📊 Error Budget Status:`);
      status.deployments.errorBudget.statuses.forEach(s => {
        const statusIcon = s.status === 'HEALTHY' ? '✅' : s.status === 'WARNING' ? '⚠️' : s.status === 'CRITICAL' ? '🔶' : '🔴';
        console.log(`   ${statusIcon} ${s.serviceName}: ${(s.errorBudget * 100).toFixed(1)}% budget remaining (${s.status})`);
      });
      
      return status;
    } catch (error) {
      console.error(`❌ Status error: ${error.message}`);
      return null;
    }
  }
  
  async watchDeployment(deploymentId, strategy) {
    console.log(`👀 Watching deployment: ${deploymentId}`);
    
    const interval = setInterval(async () => {
      try {
        const status = await this.getDeploymentStatus();
        const deployment = this.findDeployment(status, deploymentId);
        
        if (!deployment) {
          console.log(`❌ Deployment not found: ${deploymentId}`);
          clearInterval(interval);
          return;
        }
        
        console.log(`📊 ${new Date().toLocaleTimeString()} - ${deployment.stage} (${deployment.trafficPercentage || 0}%)`);
        
        if (['COMPLETED', 'FAILED', 'ROLLED_BACK'].includes(deployment.stage)) {
          const statusIcon = deployment.stage === 'COMPLETED' ? '✅' : '❌';
          console.log(`${statusIcon} Deployment ${deployment.stage.toLowerCase()}`);
          clearInterval(interval);
        }
      } catch (error) {
        console.error(`Watch error: ${error.message}`);
      }
    }, 10000); // Check every 10 seconds
  }
  
  async getDeploymentStatus(serviceName) {
    const url = serviceName 
      ? `/api/deployments/status?service=${serviceName}&history=true&metrics=true`
      : '/api/deployments/status?history=true&metrics=true';
      
    return this.makeRequest(url);
  }
  
  findDeployment(status, deploymentId) {
    // Check canary deployments
    for (const deployment of status.deployments.canary.deployments) {
      if (deployment.id === deploymentId) {
        return { ...deployment, type: 'canary' };
      }
    }
    
    // Check blue-green deployments
    for (const deployment of status.deployments.blueGreen.deployments) {
      if (deployment.id === deploymentId) {
        return { ...deployment, type: 'blueGreen' };
      }
    }
    
    return null;
  }
  
  async makeRequest(path, options = {}) {
    return new Promise((resolve, reject) => {
      const requestOptions = {
        hostname: 'localhost',
        port: 3000,
        path,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      };

      const req = http.request(requestOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        });
      });

      req.on('error', reject);
      
      if (options.body) {
        req.write(options.body);
      }
      
      req.end();
    });
  }
}

// CLI interface
const cli = new DeploymentCLI();
const [,, command, ...args] = process.argv;

switch (command) {
  case 'deploy':
    const [serviceName, version, strategy = 'canary'] = args;
    if (!serviceName || !version) {
      console.log('Usage: deploy <service> <version> [strategy] [--critical] [--watch]');
      process.exit(1);
    }
    
    const options = {
      critical: args.includes('--critical'),
      watch: args.includes('--watch')
    };
    
    cli.deploy(serviceName, version, strategy, options);
    break;
    
  case 'rollback':
    const [deploymentId, ...reasonParts] = args;
    if (!deploymentId) {
      console.log('Usage: rollback <deployment-id> [reason]');
      process.exit(1);
    }
    
    const reason = reasonParts.join(' ') || 'Manual rollback';
    cli.rollback(deploymentId, reason);
    break;
    
  case 'status':
    const [service] = args;
    cli.status(service);
    break;
    
  default:
    console.log('Safe Deployments CLI');
    console.log('');
    console.log('Commands:');
    console.log('  deploy <service> <version> [canary|blue-green] [--critical] [--watch]');
    console.log('  rollback <deployment-id> [reason]');
    console.log('  status [service]');
    console.log('');
    console.log('Examples:');
    console.log('  deploy api-gateway v1.2.3 canary --watch');
    console.log('  deploy user-service v2.0.0 blue-green --critical');
    console.log('  rollback canary-api-gateway-v1.2.3-1699123456-abc123');
    console.log('  status api-gateway');
}
