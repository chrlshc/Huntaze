#!/usr/bin/env node

/**
 * Force Amplify Redeploy
 * Creates a minimal change to trigger a new Amplify deployment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class AmplifyRedeployForcer {
  constructor() {
    this.timestamp = new Date().toISOString();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  createDeploymentTrigger() {
    this.log('Creating deployment trigger...');
    
    // Create a deployment marker file
    const deploymentInfo = {
      deploymentId: `deploy-${Date.now()}`,
      timestamp: this.timestamp,
      reason: 'Force redeploy to fix 404 issues',
      version: '1.0.0',
      environment: 'production',
      triggeredBy: 'deployment-fix-script'
    };

    const deploymentPath = path.join(process.cwd(), 'DEPLOYMENT_TRIGGER.json');
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    
    this.log(`✅ Created deployment trigger: ${deploymentInfo.deploymentId}`);
    return deploymentInfo;
  }

  updateAmplifyConfig() {
    this.log('Updating Amplify configuration for better reliability...');
    
    const amplifyConfig = `version: 1
frontend:
  phases:
    preBuild:
      commands:
        - echo "=== PRE-BUILD PHASE ==="
        - echo "Node.js version:" && node --version
        - echo "NPM version:" && npm --version
        - echo "Installing dependencies..."
        - npm ci --prefer-offline --no-audit --silent
        - echo "Dependencies installed successfully"
    build:
      commands:
        - echo "=== BUILD PHASE ==="
        - echo "Setting build environment..."
        - export NODE_ENV=production
        - export SKIP_ENV_VALIDATION=1
        - export NODE_OPTIONS="--max-old-space-size=4096"
        - export NEXT_TELEMETRY_DISABLED=1
        - echo "Building Next.js application..."
        - npm run build
        - echo "Build completed successfully"
        - echo "Verifying build artifacts..."
        - ls -la .next/
        - echo "Build verification complete"
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
`;

    const amplifyPath = path.join(process.cwd(), 'amplify.yml');
    fs.writeFileSync(amplifyPath, amplifyConfig);
    
    this.log('✅ Updated amplify.yml with enhanced build process');
  }

  createHealthCheckEndpoint() {
    this.log('Ensuring health check endpoint exists...');
    
    const healthCheckDir = path.join(process.cwd(), 'app/api/health');
    const healthCheckFile = path.join(healthCheckDir, 'route.ts');
    
    if (!fs.existsSync(healthCheckDir)) {
      fs.mkdirSync(healthCheckDir, { recursive: true });
    }

    const healthCheckCode = `import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      deployment: {
        id: process.env.AWS_AMPLIFY_WEBHOOK_URL ? 'amplify' : 'local',
        region: process.env.AWS_REGION || 'unknown'
      },
      services: {
        database: process.env.DATABASE_URL ? 'configured' : 'not-configured',
        auth: process.env.JWT_SECRET ? 'configured' : 'not-configured',
        redis: process.env.REDIS_URL ? 'configured' : 'not-configured'
      }
    };

    return NextResponse.json(health, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}
`;

    fs.writeFileSync(healthCheckFile, healthCheckCode);
    this.log('✅ Created/updated health check endpoint');
  }

  updatePackageJsonForAmplify() {
    this.log('Updating package.json for Amplify compatibility...');
    
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Ensure proper build scripts
    packageJson.scripts = packageJson.scripts || {};
    packageJson.scripts.build = 'next build';
    packageJson.scripts.start = 'next start';
    
    // Add Amplify-specific configurations
    packageJson.engines = packageJson.engines || {};
    packageJson.engines.node = '>=18.17.0';
    packageJson.engines.npm = '>=8.0.0';
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    this.log('✅ Updated package.json for Amplify');
  }

  createSimpleHomePage() {
    this.log('Ensuring home page exists...');
    
    const homePagePath = path.join(process.cwd(), 'app/page.tsx');
    
    if (!fs.existsSync(homePagePath)) {
      const homePageCode = `import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Huntaze - Social Media Management Platform',
  description: 'Manage your social media presence with AI-powered tools',
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Welcome to Huntaze
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Your AI-powered social media management platform
          </p>
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-4">Platform Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-100 rounded-lg p-4">
                  <h3 className="font-medium text-green-800">✅ Application</h3>
                  <p className="text-green-600">Running</p>
                </div>
                <div className="bg-blue-100 rounded-lg p-4">
                  <h3 className="font-medium text-blue-800">🔗 API</h3>
                  <p className="text-blue-600">Available</p>
                </div>
                <div className="bg-purple-100 rounded-lg p-4">
                  <h3 className="font-medium text-purple-800">🚀 Deployment</h3>
                  <p className="text-purple-600">Active</p>
                </div>
              </div>
            </div>
            <div className="flex justify-center space-x-4">
              <a 
                href="/auth/login" 
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Login
              </a>
              <a 
                href="/auth/register" 
                className="bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition-colors"
              >
                Register
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
`;

      fs.writeFileSync(homePagePath, homePageCode);
      this.log('✅ Created home page');
    } else {
      this.log('✅ Home page already exists');
    }
  }

  commitAndPushChanges(deploymentInfo) {
    this.log('Committing and pushing changes...');
    
    try {
      // Add all changes
      execSync('git add .', { stdio: 'pipe' });
      
      // Commit with deployment info
      const commitMessage = `fix(deployment): Force redeploy to fix 404 issues

- Updated Amplify configuration for better reliability
- Enhanced build process with proper error handling
- Added health check endpoint for monitoring
- Deployment ID: ${deploymentInfo.deploymentId}
- Timestamp: ${deploymentInfo.timestamp}

This commit triggers a new Amplify deployment to resolve
the 404 errors affecting all routes including auth endpoints.`;

      execSync(`git commit -m "${commitMessage}"`, { stdio: 'pipe' });
      
      // Push to trigger deployment
      execSync('git push origin main', { stdio: 'inherit' });
      
      this.log('✅ Changes committed and pushed successfully');
      return true;
    } catch (error) {
      this.log(`Git operations failed: ${error.message}`, 'error');
      this.log('Please commit and push manually:', 'info');
      this.log('git add .', 'info');
      this.log(`git commit -m "fix(deployment): Force redeploy - ${deploymentInfo.deploymentId}"`, 'info');
      this.log('git push origin main', 'info');
      return false;
    }
  }

  generateDeploymentInstructions(deploymentInfo) {
    this.log('=== DEPLOYMENT INSTRUCTIONS ===');
    this.log(`Deployment ID: ${deploymentInfo.deploymentId}`);
    this.log(`Timestamp: ${deploymentInfo.timestamp}`);
    this.log('');
    this.log('Next steps:');
    this.log('1. ✅ Changes have been committed and pushed');
    this.log('2. 🔄 Amplify will automatically start a new build');
    this.log('3. 📊 Monitor build progress in Amplify Console');
    this.log('4. 🧪 Test the application once deployment completes');
    this.log('');
    this.log('Amplify Console: https://console.aws.amazon.com/amplify/');
    this.log('App URL: https://d2gmcfr71gawhz.amplifyapp.com');
    this.log('Health Check: https://d2gmcfr71gawhz.amplifyapp.com/api/health');
    this.log('');
    this.log('Expected deployment time: 5-10 minutes');
    this.log('');
    this.log('If issues persist:');
    this.log('- Check Amplify build logs for errors');
    this.log('- Verify environment variables are configured');
    this.log('- Ensure all required dependencies are installed');
  }

  async run() {
    try {
      this.log('🚀 Starting forced Amplify redeploy...');
      
      // Create deployment trigger
      const deploymentInfo = this.createDeploymentTrigger();
      
      // Update configurations
      this.updateAmplifyConfig();
      this.updatePackageJsonForAmplify();
      
      // Ensure critical files exist
      this.createHealthCheckEndpoint();
      this.createSimpleHomePage();
      
      // Commit and push changes
      const pushSuccess = this.commitAndPushChanges(deploymentInfo);
      
      // Generate instructions
      this.generateDeploymentInstructions(deploymentInfo);
      
      if (pushSuccess) {
        this.log('🎉 Forced redeploy initiated successfully!');
        this.log('Monitor Amplify Console for build progress.');
      } else {
        this.log('⚠️ Manual git operations required - see instructions above');
      }
      
      return true;
      
    } catch (error) {
      this.log(`Forced redeploy failed: ${error.message}`, 'error');
      return false;
    }
  }
}

// Run forcer if this script is executed directly
if (require.main === module) {
  const forcer = new AmplifyRedeployForcer();
  forcer.run().catch(error => {
    console.error('Forced redeploy failed:', error);
    process.exit(1);
  });
}

module.exports = AmplifyRedeployForcer;