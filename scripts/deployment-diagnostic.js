#!/usr/bin/env node

/**
 * Comprehensive Deployment Diagnostic Tool
 * Analyzes Git configuration and Amplify connectivity
 * Usage: AWS_ACCESS_KEY_ID=REDACTED AWS_SECRET_ACCESS_KEY=REDACTED node scripts/deployment-diagnostic.js
 */

const { AmplifyClient, ListAppsCommand, GetAppCommand, ListBranchesCommand, ListJobsCommand } = require('@aws-sdk/client-amplify');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class DeploymentDiagnostic {
    constructor() {
        this.gitAnalysis = null;
        this.amplifyAnalysis = null;
        this.diagnosticReport = {
            timestamp: new Date().toISOString(),
            issues: [],
            recommendations: [],
            status: 'unknown'
        };
    }

    /**
     * Execute git command safely
     */
    execGit(command) {
        try {
            return execSync(`git ${command}`, { encoding: 'utf8' }).trim();
        } catch (error) {
            return null;
        }
    }

    /**
     * Analyze Git configuration
     */
    async analyzeGitConfiguration() {
        console.log('🔍 Analyzing Git configuration...\n');

        try {
            // Import and run Git analysis
            const GitRemoteAnalyzer = require('./analyze-git-remotes.js');
            const analyzer = new GitRemoteAnalyzer();
            this.gitAnalysis = analyzer.analyzeRemotes();

            console.log('✅ Git analysis completed');
            return this.gitAnalysis;
        } catch (error) {
            console.error('❌ Git analysis failed:', error.message);
            this.diagnosticReport.issues.push(`Git analysis failed: ${error.message}`);
            return null;
        }
    }

    /**
     * Analyze Amplify configuration
     */
    async analyzeAmplifyConfiguration() {
        console.log('\n🔍 Analyzing Amplify configuration...\n');

        // Check AWS credentials
        if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
            const error = 'AWS credentials not provided';
            console.log('⚠️  ' + error);
            this.diagnosticReport.issues.push(error);
            return null;
        }

        try {
            const client = new AmplifyClient({
                region: process.env.AWS_REGION || 'us-east-1',
                credentials: {
                    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                    sessionToken: process.env.AWS_SESSION_TOKEN
                }
            });

            // Get Amplify apps
            const listAppsResponse = await client.send(new ListAppsCommand({}));
            
            if (!listAppsResponse.apps || listAppsResponse.apps.length === 0) {
                const error = 'No Amplify applications found';
                console.log('❌ ' + error);
                this.diagnosticReport.issues.push(error);
                return null;
            }

            // Find Huntaze app
            const huntazeApp = listAppsResponse.apps.find(app =>
                app.name.toLowerCase().includes('huntaze') ||
                app.repository?.includes('huntaze') ||
                app.repository?.includes('Huntaze')
            );

            if (!huntazeApp) {
                const error = 'Huntaze application not found in Amplify';
                console.log('❌ ' + error);
                this.diagnosticReport.issues.push(error);
                return null;
            }

            console.log(`✅ Found Amplify app: ${huntazeApp.name} (${huntazeApp.appId})`);

            // Get app details
            const appDetails = await client.send(new GetAppCommand({ appId: huntazeApp.appId }));
            
            // Get branches
            const branchesResponse = await client.send(new ListBranchesCommand({ appId: huntazeApp.appId }));

            this.amplifyAnalysis = {
                app: huntazeApp,
                details: appDetails.app,
                branches: branchesResponse.branches,
                repository: huntazeApp.repository
            };

            console.log('✅ Amplify analysis completed');
            return this.amplifyAnalysis;

        } catch (error) {
            console.error('❌ Amplify analysis failed:', error.message);
            this.diagnosticReport.issues.push(`Amplify analysis failed: ${error.message}`);
            return null;
        }
    }

    /**
     * Cross-analyze Git and Amplify configurations
     */
    crossAnalyze() {
        console.log('\n🔍 Cross-analyzing Git and Amplify configurations...\n');

        if (!this.gitAnalysis || !this.amplifyAnalysis) {
            console.log('⚠️  Cannot perform cross-analysis - missing data');
            return;
        }

        // Check if Git remote matches Amplify repository
        const amplifyRepo = this.amplifyAnalysis.repository;
        const amplifyRemote = this.gitAnalysis.amplifyConnected;

        if (!amplifyRemote) {
            this.diagnosticReport.issues.push('No Git remote identified as Amplify-connected');
        } else {
            console.log(`📋 Amplify remote: ${amplifyRemote}`);
            console.log(`📋 Amplify repository: ${amplifyRepo}`);
        }

        // Check staging branch configuration
        const stagingBranch = this.amplifyAnalysis.branches.find(b => b.branchName === 'staging');
        
        if (!stagingBranch) {
            this.diagnosticReport.issues.push('Staging branch not configured in Amplify');
        } else {
            console.log(`📋 Staging branch in Amplify: ${stagingBranch.enableAutoBuild ? 'Auto-build ON' : 'Auto-build OFF'}`);
            
            if (!stagingBranch.enableAutoBuild) {
                this.diagnosticReport.issues.push('Auto-build disabled for staging branch in Amplify');
            }
        }

        // Check if local staging branch tracks correct remote
        if (this.gitAnalysis.branches) {
            const localStagingBranch = this.gitAnalysis.branches.find(b => b.name === 'staging');
            
            if (localStagingBranch && localStagingBranch.tracking) {
                const trackingMatch = localStagingBranch.tracking.match(/^([^\/]+)\/(.+)$/);
                if (trackingMatch) {
                    const [, remoteName] = trackingMatch;
                    if (remoteName !== amplifyRemote) {
                        this.diagnosticReport.issues.push(`Local staging branch tracks ${remoteName}, but Amplify remote is ${amplifyRemote}`);
                    }
                }
            }
        }
    }

    /**
     * Generate recommendations
     */
    generateRecommendations() {
        console.log('\n💡 Generating recommendations...\n');

        // Git-based recommendations
        if (this.gitAnalysis) {
            this.diagnosticReport.recommendations.push(...this.gitAnalysis.recommendations);
        }

        // Amplify-based recommendations
        if (this.amplifyAnalysis) {
            const stagingBranch = this.amplifyAnalysis.branches.find(b => b.branchName === 'staging');
            
            if (!stagingBranch) {
                this.diagnosticReport.recommendations.push('Configure staging branch in Amplify console');
            } else if (!stagingBranch.enableAutoBuild) {
                this.diagnosticReport.recommendations.push('Enable auto-build for staging branch in Amplify');
            }
        }

        // Cross-analysis recommendations
        if (this.diagnosticReport.issues.length > 0) {
            this.diagnosticReport.recommendations.push('Run Git remote cleanup script');
            this.diagnosticReport.recommendations.push('Verify webhook configuration in GitHub');
        }

        // Determine overall status
        if (this.diagnosticReport.issues.length === 0) {
            this.diagnosticReport.status = 'healthy';
        } else if (this.diagnosticReport.issues.length <= 2) {
            this.diagnosticReport.status = 'needs_attention';
        } else {
            this.diagnosticReport.status = 'critical';
        }
    }

    /**
     * Generate comprehensive report
     */
    generateReport() {
        console.log('\n📊 Deployment Diagnostic Report\n');
        console.log('=' .repeat(60));

        // Overall Status
        const statusIcon = this.diagnosticReport.status === 'healthy' ? '✅' :
                          this.diagnosticReport.status === 'needs_attention' ? '⚠️' : '❌';
        
        console.log(`\n${statusIcon} Overall Status: ${this.diagnosticReport.status.toUpperCase()}`);
        console.log(`   Timestamp: ${this.diagnosticReport.timestamp}`);

        // Git Configuration Summary
        if (this.gitAnalysis) {
            console.log('\n🔧 Git Configuration:');
            console.log(`   Current Branch: ${this.execGit('branch --show-current') || 'unknown'}`);
            console.log(`   Amplify Remote: ${this.gitAnalysis.amplifyConnected || 'Not identified'}`);
            console.log(`   Total Remotes: ${this.gitAnalysis.remotes?.length || 0}`);
        }

        // Amplify Configuration Summary
        if (this.amplifyAnalysis) {
            console.log('\n☁️  Amplify Configuration:');
            console.log(`   App Name: ${this.amplifyAnalysis.app.name}`);
            console.log(`   App ID: ${this.amplifyAnalysis.app.appId}`);
            console.log(`   Repository: ${this.amplifyAnalysis.repository}`);
            console.log(`   Branches: ${this.amplifyAnalysis.branches.length}`);
            
            const stagingBranch = this.amplifyAnalysis.branches.find(b => b.branchName === 'staging');
            if (stagingBranch) {
                console.log(`   Staging Auto-build: ${stagingBranch.enableAutoBuild ? 'Enabled' : 'Disabled'}`);
            }
        }

        // Issues
        if (this.diagnosticReport.issues.length > 0) {
            console.log('\n❌ Issues Found:');
            this.diagnosticReport.issues.forEach((issue, index) => {
                console.log(`   ${index + 1}. ${issue}`);
            });
        }

        // Recommendations
        if (this.diagnosticReport.recommendations.length > 0) {
            console.log('\n💡 Recommendations:');
            this.diagnosticReport.recommendations.forEach((rec, index) => {
                console.log(`   ${index + 1}. ${rec}`);
            });
        }

        // Next Steps
        console.log('\n🚀 Next Steps:');
        if (this.diagnosticReport.status === 'healthy') {
            console.log('   • Test deployment by pushing to staging branch');
            console.log('   • Monitor Amplify console for build triggers');
        } else {
            console.log('   • Run: node scripts/fix-git-remotes.js');
            console.log('   • Check Amplify console branch configuration');
            console.log('   • Verify GitHub webhook settings');
        }

        console.log('\n' + '=' .repeat(60));
    }

    /**
     * Save diagnostic report
     */
    saveReport() {
        const reportData = {
            ...this.diagnosticReport,
            gitAnalysis: this.gitAnalysis,
            amplifyAnalysis: this.amplifyAnalysis
        };

        const reportPath = path.join(process.cwd(), 'deployment-diagnostic-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
        console.log(`\n💾 Diagnostic report saved to: ${reportPath}`);
    }

    /**
     * Run complete diagnostic
     */
    async runDiagnostic() {
        console.log('🚀 Starting comprehensive deployment diagnostic...\n');

        try {
            // Run Git analysis
            await this.analyzeGitConfiguration();

            // Run Amplify analysis
            await this.analyzeAmplifyConfiguration();

            // Cross-analyze configurations
            this.crossAnalyze();

            // Generate recommendations
            this.generateRecommendations();

            // Generate and save report
            this.generateReport();
            this.saveReport();

            // Exit with appropriate code
            const exitCode = this.diagnosticReport.status === 'critical' ? 2 :
                           this.diagnosticReport.status === 'needs_attention' ? 1 : 0;
            
            process.exit(exitCode);

        } catch (error) {
            console.error('❌ Diagnostic failed:', error.message);
            process.exit(1);
        }
    }
}

// Main execution
async function main() {
    const diagnostic = new DeploymentDiagnostic();
    await diagnostic.runDiagnostic();
}

if (require.main === module) {
    main();
}

module.exports = DeploymentDiagnostic;