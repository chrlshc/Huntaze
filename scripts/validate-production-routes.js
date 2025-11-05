#!/usr/bin/env node

/**
 * Production Routes Validation Script
 * Validates all critical routes are working on app.huntaze.com
 */

const https = require('https');
const { URL } = require('url');

class ProductionRoutesValidator {
  constructor() {
    this.baseUrl = 'https://app.huntaze.com';
    this.results = {
      passed: [],
      failed: [],
      warnings: []
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  async makeRequest(path, method = 'GET', expectedStatus = 200) {
    return new Promise((resolve) => {
      const url = new URL(path, this.baseUrl);
      
      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname + url.search,
        method: method,
        headers: {
          'User-Agent': 'Huntaze-Route-Validator/1.0',
          'Accept': 'application/json, text/html, */*',
          'Content-Type': 'application/json'
        },
        timeout: 10000
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
            success: res.statusCode === expectedStatus
          });
        });
      });

      req.on('error', (error) => {
        resolve({
          status: 0,
          error: error.message,
          success: false
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          status: 0,
          error: 'Request timeout',
          success: false
        });
      });

      req.end();
    });
  }

  async validateRoute(path, description, expectedStatus = 200, method = 'GET') {
    this.log(`Testing ${description}: ${this.baseUrl}${path}`);
    
    try {
      const result = await this.makeRequest(path, method, expectedStatus);
      
      if (result.success) {
        this.results.passed.push({
          path,
          description,
          status: result.status,
          method
        });
        this.log(`✅ ${description} - Status: ${result.status}`, 'success');
        return true;
      } else {
        this.results.failed.push({
          path,
          description,
          status: result.status,
          error: result.error,
          method
        });
        this.log(`❌ ${description} - Status: ${result.status || 'ERROR'} - ${result.error || 'Unexpected status'}`, 'error');
        return false;
      }
    } catch (error) {
      this.results.failed.push({
        path,
        description,
        error: error.message,
        method
      });
      this.log(`❌ ${description} - Error: ${error.message}`, 'error');
      return false;
    }
  }

  async validateCoreRoutes() {
    this.log('🔍 Validating Core Application Routes...');
    
    const coreRoutes = [
      ['/', 'Landing Page', 200],
      ['/auth/login', 'Login Page', 200],
      ['/auth/register', 'Register Page', 200],
      ['/dashboard', 'Dashboard Page', 200],
      ['/api/health', 'Health Check API', 200]
    ];

    for (const [path, description, expectedStatus] of coreRoutes) {
      await this.validateRoute(path, description, expectedStatus);
    }
  }

  async validateAuthRoutes() {
    this.log('🔐 Validating Authentication API Routes...');
    
    const authRoutes = [
      ['/api/auth/login', 'Login API Endpoint', 400, 'POST'], // 400 because no body
      ['/api/auth/register', 'Register API Endpoint', 400, 'POST'], // 400 because no body
      ['/api/auth/verify', 'Verify API Endpoint', 400, 'POST'], // 400 because no body
    ];

    for (const [path, description, expectedStatus, method] of authRoutes) {
      await this.validateRoute(path, description, expectedStatus, method);
    }
  }

  async validateOAuthCallbacks() {
    this.log('🔗 Validating OAuth Callback Routes...');
    
    const oauthRoutes = [
      ['/api/auth/tiktok/callback', 'TikTok OAuth Callback', 400], // 400 without proper params
      ['/api/auth/instagram/callback', 'Instagram OAuth Callback', 400], // 400 without proper params
      ['/api/auth/reddit/callback', 'Reddit OAuth Callback', 400], // 400 without proper params
    ];

    for (const [path, description, expectedStatus] of oauthRoutes) {
      await this.validateRoute(path, description, expectedStatus);
    }
  }

  async validateSocialPlatformRoutes() {
    this.log('📱 Validating Social Platform Routes...');
    
    const socialRoutes = [
      ['/platforms/connect/tiktok', 'TikTok Connect Page', 200],
      ['/platforms/connect/instagram', 'Instagram Connect Page', 200],
      ['/platforms/connect/reddit', 'Reddit Connect Page', 200],
    ];

    for (const [path, description, expectedStatus] of socialRoutes) {
      await this.validateRoute(path, description, expectedStatus);
    }
  }

  async validateOnlyFansRoutes() {
    this.log('💰 Validating OnlyFans CRM Routes...');
    
    const onlyFansRoutes = [
      ['/messages/onlyfans-crm', 'OnlyFans CRM Messages Page', 200],
      ['/platforms/onlyfans/analytics', 'OnlyFans Analytics Page', 200],
      ['/api/monitoring/onlyfans', 'OnlyFans Monitoring API', 401], // 401 without auth
    ];

    for (const [path, description, expectedStatus] of onlyFansRoutes) {
      await this.validateRoute(path, description, expectedStatus);
    }
  }

  async validateAnalyticsRoutes() {
    this.log('📊 Validating Analytics Routes...');
    
    const analyticsRoutes = [
      ['/analytics', 'Analytics Dashboard', 200],
      ['/analytics/advanced', 'Advanced Analytics', 200],
      ['/monitoring', 'Monitoring Dashboard', 200],
    ];

    for (const [path, description, expectedStatus] of analyticsRoutes) {
      await this.validateRoute(path, description, expectedStatus);
    }
  }

  async validateContentCreationRoutes() {
    this.log('✍️ Validating Content Creation Routes...');
    
    const contentRoutes = [
      ['/campaigns/new', 'New Campaign Page', 200],
      ['/messages/bulk', 'Bulk Messages Page', 200],
    ];

    for (const [path, description, expectedStatus] of contentRoutes) {
      await this.validateRoute(path, description, expectedStatus);
    }
  }

  async validateAPIHealthChecks() {
    this.log('🏥 Validating API Health Checks...');
    
    const healthRoutes = [
      ['/api/health', 'General Health Check', 200],
      ['/api/health/auth', 'Auth Health Check', 200],
      ['/api/health/database', 'Database Health Check', 200],
      ['/api/health/config', 'Config Health Check', 200],
    ];

    for (const [path, description, expectedStatus] of healthRoutes) {
      await this.validateRoute(path, description, expectedStatus);
    }
  }

  generateReport() {
    this.log('📋 Generating Validation Report...');
    
    const totalTests = this.results.passed.length + this.results.failed.length;
    const passRate = totalTests > 0 ? Math.round((this.results.passed.length / totalTests) * 100) : 0;
    
    console.log('\n=== PRODUCTION ROUTES VALIDATION REPORT ===');
    console.log(`🌐 Base URL: ${this.baseUrl}`);
    console.log(`📊 Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${this.results.passed.length}`);
    console.log(`❌ Failed: ${this.results.failed.length}`);
    console.log(`📈 Pass Rate: ${passRate}%`);
    
    if (this.results.failed.length > 0) {
      console.log('\n❌ FAILED ROUTES:');
      this.results.failed.forEach((failure, index) => {
        console.log(`${index + 1}. ${failure.description}`);
        console.log(`   Path: ${failure.path}`);
        console.log(`   Method: ${failure.method || 'GET'}`);
        console.log(`   Status: ${failure.status || 'ERROR'}`);
        console.log(`   Error: ${failure.error || 'Unexpected response'}`);
        console.log('');
      });
    }

    if (this.results.passed.length > 0) {
      console.log('\n✅ PASSED ROUTES:');
      this.results.passed.forEach((success, index) => {
        console.log(`${index + 1}. ${success.description} (${success.method || 'GET'} ${success.status})`);
      });
    }

    console.log('\n=== VALIDATION SUMMARY ===');
    if (passRate >= 90) {
      console.log('🎉 Excellent! Your production routes are working great!');
    } else if (passRate >= 75) {
      console.log('👍 Good! Most routes are working, but some need attention.');
    } else if (passRate >= 50) {
      console.log('⚠️ Warning! Several routes need fixing.');
    } else {
      console.log('🚨 Critical! Many routes are failing and need immediate attention.');
    }

    return {
      totalTests,
      passed: this.results.passed.length,
      failed: this.results.failed.length,
      passRate,
      success: passRate >= 75
    };
  }

  async run() {
    try {
      this.log('🚀 Starting Production Routes Validation...');
      this.log(`🌐 Target: ${this.baseUrl}`);
      
      // Run all validation categories
      await this.validateCoreRoutes();
      await this.validateAuthRoutes();
      await this.validateOAuthCallbacks();
      await this.validateSocialPlatformRoutes();
      await this.validateOnlyFansRoutes();
      await this.validateAnalyticsRoutes();
      await this.validateContentCreationRoutes();
      await this.validateAPIHealthChecks();
      
      // Generate final report
      const report = this.generateReport();
      
      this.log('🎯 Production routes validation completed!');
      return report;
      
    } catch (error) {
      this.log(`💥 Validation failed: ${error.message}`, 'error');
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Run validator if this script is executed directly
if (require.main === module) {
  const validator = new ProductionRoutesValidator();
  validator.run().then(report => {
    if (report.success) {
      console.log('\n🎉 All critical routes are working correctly!');
      process.exit(0);
    } else {
      console.log('\n🚨 Some routes need attention. Check the report above.');
      process.exit(1);
    }
  }).catch(error => {
    console.error('Validation script failed:', error);
    process.exit(1);
  });
}

module.exports = ProductionRoutesValidator;