#!/usr/bin/env node

/**
 * Diagnostic Report Generator
 * Creates a comprehensive report of the deployment issue and solution
 * Usage: node scripts/generate-diagnostic-report.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DiagnosticReportGenerator {
    constructor() {
        this.report = {
            timestamp: new Date().toISOString(),
            issue: {
                title: 'Amplify Auto-Deployment Not Triggering',
                description: 'Commits to staging branch are not automatically triggering AWS Amplify deployments',
                severity: 'HIGH',
                impact: 'Deployment pipeline broken'
            },
            rootCause: null,
            solution: null,
            status: 'IDENTIFIED'
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
     * Analyze the current situation
     */
    analyzeSituation() {
        console.log('🔍 Analyzing deployment issue...\n');

        // Check if analysis file exists
        const analysisPath = path.join(process.cwd(), 'git-remote-analysis.json');
        let gitAnalysis = null;

        if (fs.existsSync(analysisPath)) {
            try {
                gitAnalysis = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));
                console.log('✅ Found existing Git analysis');
            } catch (error) {
                console.log('⚠️  Could not read existing Git analysis');
            }
        }

        // Get current Git status
        const currentBranch = this.execGit('branch --show-current');
        const branchInfo = this.execGit('branch -vv');
        const remotes = this.execGit('remote -v');

        // Identify root cause
        this.identifyRootCause(gitAnalysis, currentBranch, branchInfo, remotes);
        
        // Define solution
        this.defineSolution();

        return this.report;
    }

    /**
     * Identify the root cause of the issue
     */
    identifyRootCause(gitAnalysis, currentBranch, branchInfo, remotes) {
        console.log('🔍 Identifying root cause...');

        // Check if staging branch has upstream tracking
        const stagingTrackingMatch = branchInfo ? branchInfo.match(/\*?\s*staging\s+\w+\s*(?:\[([^\]]+)\])?/) : null;
        const stagingTracking = stagingTrackingMatch ? stagingTrackingMatch[1] : null;

        if (!stagingTracking) {
            this.report.rootCause = {
                primary: 'Staging branch has no upstream tracking',
                details: [
                    'The local staging branch is not configured to track a remote branch',
                    'Git pushes are not reaching the repository monitored by Amplify',
                    'Amplify webhooks are not being triggered because no commits reach the remote'
                ],
                evidence: {
                    currentBranch,
                    stagingTracking: 'None',
                    remotesAvailable: remotes ? remotes.split('\\n').length / 2 : 0
                }
            };
            console.log('✅ Root cause identified: No upstream tracking for staging branch');
        } else {
            // Check if tracking points to correct remote
            const trackingRemote = stagingTracking.split('/')[0];
            const amplifyRemote = gitAnalysis?.analysis?.amplifyConnected;

            if (amplifyRemote && trackingRemote !== amplifyRemote) {
                this.report.rootCause = {
                    primary: 'Staging branch tracks wrong remote',
                    details: [
                        `Staging branch tracks ${trackingRemote} but Amplify is connected to ${amplifyRemote}`,
                        'Commits are going to the wrong repository',
                        'Amplify is not receiving webhook notifications'
                    ],
                    evidence: {
                        currentTracking: stagingTracking,
                        amplifyRemote,
                        trackingRemote
                    }
                };
                console.log(`✅ Root cause identified: Wrong remote tracking (${trackingRemote} vs ${amplifyRemote})`);
            } else {
                this.report.rootCause = {
                    primary: 'Configuration appears correct - deeper investigation needed',
                    details: [
                        'Git configuration looks correct',
                        'Issue may be in Amplify webhook or branch configuration',
                        'Manual verification of Amplify console needed'
                    ],
                    evidence: {
                        stagingTracking,
                        amplifyRemote
                    }
                };
                console.log('⚠️  Git configuration appears correct - issue may be elsewhere');
            }
        }
    }

    /**
     * Define the solution steps
     */
    defineSolution() {
        console.log('💡 Defining solution...');

        if (this.report.rootCause.primary.includes('no upstream tracking')) {
            this.report.solution = {
                type: 'Git Configuration Fix',
                steps: [
                    {
                        step: 1,
                        action: 'Set upstream tracking for staging branch',
                        command: 'git branch --set-upstream-to=huntaze/staging staging',
                        description: 'Configure staging branch to track huntaze/staging remote'
                    },
                    {
                        step: 2,
                        action: 'Test push connectivity',
                        command: 'git push huntaze staging',
                        description: 'Verify that pushes reach the correct remote repository'
                    },
                    {
                        step: 3,
                        action: 'Monitor Amplify console',
                        command: 'Check AWS Amplify console for build trigger',
                        description: 'Verify that Amplify receives webhook and starts build'
                    }
                ],
                automatedScript: 'node scripts/fix-git-remotes.js',
                estimatedTime: '2-5 minutes'
            };
        } else if (this.report.rootCause.primary.includes('wrong remote')) {
            this.report.solution = {
                type: 'Remote Tracking Correction',
                steps: [
                    {
                        step: 1,
                        action: 'Update upstream tracking',
                        command: 'git branch --set-upstream-to=huntaze/staging staging',
                        description: 'Point staging branch to correct Amplify-connected remote'
                    },
                    {
                        step: 2,
                        action: 'Verify configuration',
                        command: 'git branch -vv | grep staging',
                        description: 'Confirm tracking is set correctly'
                    },
                    {
                        step: 3,
                        action: 'Test deployment',
                        command: 'git push huntaze staging',
                        description: 'Test the corrected configuration'
                    }
                ],
                automatedScript: 'node scripts/fix-git-remotes.js',
                estimatedTime: '2-5 minutes'
            };
        } else {
            this.report.solution = {
                type: 'Manual Investigation Required',
                steps: [
                    {
                        step: 1,
                        action: 'Check Amplify branch configuration',
                        command: 'AWS Amplify Console > App > Branches',
                        description: 'Verify staging branch is configured with auto-build enabled'
                    },
                    {
                        step: 2,
                        action: 'Check GitHub webhooks',
                        command: 'GitHub > Repository > Settings > Webhooks',
                        description: 'Verify Amplify webhook is active and configured correctly'
                    },
                    {
                        step: 3,
                        action: 'Test manual trigger',
                        command: 'AWS Amplify Console > Manual Deploy',
                        description: 'Test if manual deployment works to isolate webhook issues'
                    }
                ],
                automatedScript: null,
                estimatedTime: '10-15 minutes'
            };
        }

        console.log(`✅ Solution defined: ${this.report.solution.type}`);
    }

    /**
     * Generate markdown report
     */
    generateMarkdownReport() {
        const markdown = `# Deployment Diagnostic Report

**Generated:** ${this.report.timestamp}
**Status:** ${this.report.status}

## Issue Summary

**Title:** ${this.report.issue.title}
**Severity:** ${this.report.issue.severity}
**Impact:** ${this.report.issue.impact}

${this.report.issue.description}

## Root Cause Analysis

**Primary Cause:** ${this.report.rootCause.primary}

### Details:
${this.report.rootCause.details.map(detail => `- ${detail}`).join('\\n')}

### Evidence:
\`\`\`json
${JSON.stringify(this.report.rootCause.evidence, null, 2)}
\`\`\`

## Solution

**Type:** ${this.report.solution.type}
**Estimated Time:** ${this.report.solution.estimatedTime}

### Steps:
${this.report.solution.steps.map(step => 
    `${step.step}. **${step.action}**
   - Command: \`${step.command}\`
   - Description: ${step.description}`
).join('\\n\\n')}

${this.report.solution.automatedScript ? 
    `### Automated Fix
Run the automated fix script:
\`\`\`bash
${this.report.solution.automatedScript}
\`\`\`` : ''}

## Next Steps

1. Execute the solution steps above
2. Test deployment by pushing to staging branch
3. Monitor Amplify console for automatic build trigger
4. If issues persist, escalate to AWS Amplify support

## Files Generated

- \`git-remote-analysis.json\` - Detailed Git configuration analysis
- \`deployment-diagnostic-report.json\` - Machine-readable diagnostic data
- \`DEPLOYMENT_DIAGNOSTIC_REPORT.md\` - This human-readable report

---
*Report generated by Huntaze Deployment Diagnostic Tool*
`;

        return markdown;
    }

    /**
     * Save reports to files
     */
    saveReports() {
        // Save JSON report
        const jsonPath = path.join(process.cwd(), 'deployment-diagnostic-report.json');
        fs.writeFileSync(jsonPath, JSON.stringify(this.report, null, 2));
        console.log(`💾 JSON report saved: ${jsonPath}`);

        // Save Markdown report
        const markdownPath = path.join(process.cwd(), 'DEPLOYMENT_DIAGNOSTIC_REPORT.md');
        const markdown = this.generateMarkdownReport();
        fs.writeFileSync(markdownPath, markdown);
        console.log(`📄 Markdown report saved: ${markdownPath}`);

        return { jsonPath, markdownPath };
    }

    /**
     * Display summary
     */
    displaySummary() {
        console.log('\\n📊 Diagnostic Summary\\n');
        console.log('=' .repeat(50));
        console.log(`Issue: ${this.report.issue.title}`);
        console.log(`Root Cause: ${this.report.rootCause.primary}`);
        console.log(`Solution: ${this.report.solution.type}`);
        console.log(`Estimated Fix Time: ${this.report.solution.estimatedTime}`);
        
        if (this.report.solution.automatedScript) {
            console.log(`\\n🤖 Automated Fix Available:`);
            console.log(`   ${this.report.solution.automatedScript}`);
        }
        
        console.log('\\n' + '=' .repeat(50));
    }

    /**
     * Run complete diagnostic report generation
     */
    async runDiagnostic() {
        console.log('🚀 Generating comprehensive diagnostic report...\\n');

        try {
            // Analyze the situation
            this.analyzeSituation();

            // Save reports
            const paths = this.saveReports();

            // Display summary
            this.displaySummary();

            console.log('\\n✅ Diagnostic report generation completed!');
            console.log(`\\n📋 Next step: ${this.report.solution.automatedScript || 'Follow manual steps in the report'}`);

            return this.report;

        } catch (error) {
            console.error('❌ Diagnostic report generation failed:', error.message);
            process.exit(1);
        }
    }
}

// Main execution
async function main() {
    const generator = new DiagnosticReportGenerator();
    await generator.runDiagnostic();
}

if (require.main === module) {
    main();
}

module.exports = DiagnosticReportGenerator;