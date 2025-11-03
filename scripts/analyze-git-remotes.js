#!/usr/bin/env node

/**
 * Git Remote Analysis Script
 * Analyzes current Git remote configuration and identifies issues
 * Usage: node scripts/analyze-git-remotes.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class GitRemoteAnalyzer {
    constructor() {
        this.remotes = [];
        this.branches = [];
        this.currentBranch = '';
        this.analysis = {
            conflicts: [],
            recommendations: [],
            amplifyConnected: null,
            issues: []
        };
    }

    /**
     * Execute git command and return output
     */
    execGit(command) {
        try {
            return execSync(`git ${command}`, { encoding: 'utf8' }).trim();
        } catch (error) {
            console.error(`Git command failed: git ${command}`);
            console.error(error.message);
            return '';
        }
    }

    /**
     * Analyze all Git remotes
     */
    analyzeRemotes() {
        console.log('🔍 Analyzing Git remote configuration...\n');

        // Get all remotes with URLs
        const remoteOutput = this.execGit('remote -v');
        if (!remoteOutput) {
            this.analysis.issues.push('No Git remotes configured');
            return this.analysis;
        }

        // Parse remotes
        const remoteLines = remoteOutput.split('\n');
        const remoteMap = new Map();

        remoteLines.forEach(line => {
            const match = line.match(/^(\w+)\s+(.+?)\s+\((fetch|push)\)$/);
            if (match) {
                const [, name, url, type] = match;
                if (!remoteMap.has(name)) {
                    remoteMap.set(name, { name, fetchUrl: '', pushUrl: '' });
                }
                if (type === 'fetch') {
                    remoteMap.get(name).fetchUrl = url;
                } else {
                    remoteMap.get(name).pushUrl = url;
                }
            }
        });

        this.remotes = Array.from(remoteMap.values());

        // Get current branch
        this.currentBranch = this.execGit('branch --show-current');

        // Get all branches with tracking info
        const branchOutput = this.execGit('branch -vv');
        this.branches = this.parseBranchInfo(branchOutput);

        // Analyze configuration
        this.identifyAmplifyRemote();
        this.detectConflicts();
        this.checkBranchTracking();
        this.generateRecommendations();

        return this.analysis;
    }

    /**
     * Parse branch information with tracking details
     */
    parseBranchInfo(branchOutput) {
        const branches = [];
        const lines = branchOutput.split('\n');

        lines.forEach(line => {
            const match = line.match(/^(\*?)\s*(\S+)\s+(\w+)\s*(?:\[([^\]]+)\])?\s*(.*)$/);
            if (match) {
                const [, current, name, commit, tracking, description] = match;
                branches.push({
                    name,
                    commit,
                    isCurrent: current === '*',
                    tracking: tracking || null,
                    description: description || ''
                });
            }
        });

        return branches;
    }

    /**
     * Identify which remote is connected to Amplify
     */
    identifyAmplifyRemote() {
        const amplifyPatterns = [
            /github\.com[\/:]chrlshc\/huntaze/i,
            /github\.com[\/:]chrlshc\/Huntaze/i,
            /amplify/i
        ];

        for (const remote of this.remotes) {
            const urls = [remote.fetchUrl, remote.pushUrl].filter(Boolean);
            
            for (const url of urls) {
                for (const pattern of amplifyPatterns) {
                    if (pattern.test(url)) {
                        this.analysis.amplifyConnected = remote.name;
                        console.log(`✅ Found Amplify-connected remote: ${remote.name} (${url})`);
                        return;
                    }
                }
            }
        }

        this.analysis.issues.push('No Amplify-connected remote identified');
        console.log('❌ No Amplify-connected remote found');
    }

    /**
     * Detect conflicting remotes
     */
    detectConflicts() {
        if (this.remotes.length > 3) {
            this.analysis.conflicts.push(`Too many remotes configured (${this.remotes.length})`);
        }

        // Check for URL conflicts
        const urlMap = new Map();
        this.remotes.forEach(remote => {
            const urls = [remote.fetchUrl, remote.pushUrl].filter(Boolean);
            urls.forEach(url => {
                if (urlMap.has(url)) {
                    this.analysis.conflicts.push(`Duplicate URL: ${url} used by ${urlMap.get(url)} and ${remote.name}`);
                } else {
                    urlMap.set(url, remote.name);
                }
            });
        });

        // Check for case sensitivity issues
        const remoteNames = this.remotes.map(r => r.name.toLowerCase());
        const uniqueNames = [...new Set(remoteNames)];
        if (remoteNames.length !== uniqueNames.length) {
            this.analysis.conflicts.push('Case-sensitive remote name conflicts detected');
        }
    }

    /**
     * Check branch tracking configuration
     */
    checkBranchTracking() {
        const stagingBranch = this.branches.find(b => b.name === 'staging');
        
        if (!stagingBranch) {
            this.analysis.issues.push('Staging branch not found locally');
            return;
        }

        if (!stagingBranch.tracking) {
            this.analysis.issues.push('Staging branch has no upstream tracking');
        } else {
            const trackingMatch = stagingBranch.tracking.match(/^([^\/]+)\/(.+)$/);
            if (trackingMatch) {
                const [, remoteName, branchName] = trackingMatch;
                
                if (remoteName !== this.analysis.amplifyConnected) {
                    this.analysis.issues.push(`Staging branch tracks ${remoteName}/${branchName}, but Amplify remote is ${this.analysis.amplifyConnected}`);
                }
                
                console.log(`📋 Staging branch tracking: ${stagingBranch.tracking}`);
            }
        }
    }

    /**
     * Generate recommendations for fixing issues
     */
    generateRecommendations() {
        if (this.analysis.conflicts.length > 0) {
            this.analysis.recommendations.push('Clean up conflicting Git remotes');
        }

        if (!this.analysis.amplifyConnected) {
            this.analysis.recommendations.push('Configure correct Amplify-connected remote');
        }

        const stagingBranch = this.branches.find(b => b.name === 'staging');
        if (stagingBranch && !stagingBranch.tracking) {
            this.analysis.recommendations.push('Set up upstream tracking for staging branch');
        }

        if (this.remotes.length > 3) {
            this.analysis.recommendations.push('Remove unnecessary Git remotes');
        }
    }

    /**
     * Generate detailed report
     */
    generateReport() {
        console.log('\n📊 Git Remote Analysis Report\n');
        console.log('=' .repeat(50));

        // Current Status
        console.log('\n🔍 Current Configuration:');
        console.log(`   Current Branch: ${this.currentBranch}`);
        console.log(`   Total Remotes: ${this.remotes.length}`);
        console.log(`   Amplify Remote: ${this.analysis.amplifyConnected || 'Not identified'}`);

        // Remotes Details
        console.log('\n📡 Configured Remotes:');
        this.remotes.forEach(remote => {
            console.log(`   ${remote.name}:`);
            console.log(`     Fetch: ${remote.fetchUrl}`);
            console.log(`     Push:  ${remote.pushUrl || remote.fetchUrl}`);
        });

        // Branch Tracking
        console.log('\n🌿 Branch Tracking:');
        this.branches.forEach(branch => {
            const current = branch.isCurrent ? '* ' : '  ';
            const tracking = branch.tracking ? ` [${branch.tracking}]` : ' [no tracking]';
            console.log(`   ${current}${branch.name}${tracking}`);
        });

        // Issues
        if (this.analysis.issues.length > 0) {
            console.log('\n❌ Issues Found:');
            this.analysis.issues.forEach(issue => {
                console.log(`   • ${issue}`);
            });
        }

        // Conflicts
        if (this.analysis.conflicts.length > 0) {
            console.log('\n⚠️  Conflicts Detected:');
            this.analysis.conflicts.forEach(conflict => {
                console.log(`   • ${conflict}`);
            });
        }

        // Recommendations
        if (this.analysis.recommendations.length > 0) {
            console.log('\n💡 Recommendations:');
            this.analysis.recommendations.forEach(rec => {
                console.log(`   • ${rec}`);
            });
        }

        // Summary
        console.log('\n📋 Summary:');
        const issueCount = this.analysis.issues.length + this.analysis.conflicts.length;
        if (issueCount === 0) {
            console.log('   ✅ Git remote configuration looks good!');
        } else {
            console.log(`   ⚠️  Found ${issueCount} issue(s) that need attention`);
        }

        console.log('\n' + '=' .repeat(50));
    }

    /**
     * Save analysis to JSON file
     */
    saveAnalysis() {
        const reportData = {
            timestamp: new Date().toISOString(),
            currentBranch: this.currentBranch,
            remotes: this.remotes,
            branches: this.branches,
            analysis: this.analysis
        };

        const reportPath = path.join(process.cwd(), 'git-remote-analysis.json');
        fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
        console.log(`\n💾 Analysis saved to: ${reportPath}`);
    }
}

// Main execution
async function main() {
    try {
        const analyzer = new GitRemoteAnalyzer();
        const analysis = analyzer.analyzeRemotes();
        analyzer.generateReport();
        analyzer.saveAnalysis();

        // Exit with error code if issues found
        const issueCount = analysis.issues.length + analysis.conflicts.length;
        process.exit(issueCount > 0 ? 1 : 0);

    } catch (error) {
        console.error('❌ Analysis failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = GitRemoteAnalyzer;