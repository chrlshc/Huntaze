#!/usr/bin/env node

/**
 * Git Remote Configuration Fix Script
 * Fixes the staging branch tracking issue identified in the diagnostic
 * Usage: node scripts/fix-git-remotes.js
 */

const { execSync } = require('child_process');
const readline = require('readline');

class GitRemoteFixer {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    /**
     * Execute git command safely
     */
    execGit(command, options = {}) {
        try {
            const result = execSync(`git ${command}`, { 
                encoding: 'utf8',
                stdio: options.silent ? 'pipe' : 'inherit'
            });
            return result ? result.trim() : '';
        } catch (error) {
            if (!options.silent) {
                console.error(`❌ Git command failed: git ${command}`);
                console.error(error.message);
            }
            throw error;
        }
    }

    /**
     * Ask user for confirmation
     */
    async askConfirmation(question) {
        return new Promise((resolve) => {
            this.rl.question(`${question} (y/N): `, (answer) => {
                resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
            });
        });
    }

    /**
     * Check current Git status
     */
    checkCurrentStatus() {
        console.log('🔍 Checking current Git status...\n');

        try {
            const currentBranch = this.execGit('branch --show-current', { silent: true });
            const remotes = this.execGit('remote -v', { silent: true });
            const branchInfo = this.execGit('branch -vv', { silent: true });

            console.log(`📋 Current branch: ${currentBranch}`);
            console.log(`📋 Available remotes:`);
            console.log(remotes);
            
            // Check staging branch tracking
            const stagingTrackingMatch = branchInfo.match(/\*?\s*staging\s+\w+\s*(?:\[([^\]]+)\])?/);
            const stagingTracking = stagingTrackingMatch ? stagingTrackingMatch[1] : null;
            
            console.log(`\\n📋 Staging branch tracking: ${stagingTracking || 'No upstream tracking'}`);
            
            return {
                currentBranch,
                stagingTracking,
                hasHuntazeRemote: remotes.includes('huntaze'),
                isOnStaging: currentBranch === 'staging'
            };
        } catch (error) {
            console.error('❌ Failed to check Git status:', error.message);
            return null;
        }
    }

    /**
     * Fix staging branch tracking
     */
    async fixStagingTracking(status) {
        console.log('\\n🔧 Fixing staging branch tracking...');

        if (!status.hasHuntazeRemote) {
            console.log('❌ huntaze remote not found. Cannot proceed.');
            return false;
        }

        try {
            // Switch to staging branch if not already there
            if (!status.isOnStaging) {
                console.log('📋 Switching to staging branch...');
                this.execGit('checkout staging');
            }

            // Set upstream tracking to huntaze/staging
            console.log('📋 Setting upstream tracking to huntaze/staging...');
            this.execGit('branch --set-upstream-to=huntaze/staging staging');

            // Verify the change
            const newTracking = this.execGit('branch -vv | grep "\\* staging"', { silent: true });
            console.log(`✅ Staging branch tracking updated: ${newTracking}`);

            return true;
        } catch (error) {
            console.error('❌ Failed to fix staging tracking:', error.message);
            return false;
        }
    }

    /**
     * Test push connectivity
     */
    async testPushConnectivity() {
        console.log('\\n🧪 Testing push connectivity...');

        try {
            // Check if we can fetch from huntaze remote
            console.log('📋 Testing fetch from huntaze remote...');
            this.execGit('fetch huntaze --dry-run');
            console.log('✅ Fetch connectivity OK');

            // Ask if user wants to test push
            const shouldTestPush = await this.askConfirmation('Test push connectivity? (This will push current staging branch)');
            
            if (shouldTestPush) {
                console.log('📋 Testing push to huntaze/staging...');
                this.execGit('push huntaze staging');
                console.log('✅ Push connectivity OK');
                return true;
            } else {
                console.log('⏭️  Skipping push test');
                return true;
            }
        } catch (error) {
            console.error('❌ Connectivity test failed:', error.message);
            return false;
        }
    }

    /**
     * Clean up unnecessary remotes (optional)
     */
    async cleanupRemotes() {
        console.log('\\n🧹 Checking for remote cleanup opportunities...');

        try {
            const remotes = this.execGit('remote', { silent: true }).split('\\n').filter(Boolean);
            console.log(`📋 Current remotes: ${remotes.join(', ')}`);

            // We have: huntaze (Amplify), origin (fork), truehuntaze (different project)
            // This is actually reasonable, so no cleanup needed
            console.log('✅ Remote configuration looks reasonable - no cleanup needed');
            
            return true;
        } catch (error) {
            console.error('❌ Remote cleanup check failed:', error.message);
            return false;
        }
    }

    /**
     * Generate post-fix instructions
     */
    generateInstructions() {
        console.log('\\n📋 Post-Fix Instructions:\\n');
        console.log('1. 🧪 Test the fix:');
        console.log('   git add .');
        console.log('   git commit -m "test: trigger amplify deployment"');
        console.log('   git push huntaze staging');
        console.log('');
        console.log('2. 🔍 Monitor Amplify:');
        console.log('   - Check AWS Amplify console');
        console.log('   - Look for automatic build trigger within 2 minutes');
        console.log('   - Verify build starts and completes successfully');
        console.log('');
        console.log('3. 🔗 If still not working, check:');
        console.log('   - GitHub webhook configuration');
        console.log('   - Amplify branch auto-build settings');
        console.log('   - AWS credentials and permissions');
        console.log('');
        console.log('4. 📊 Run diagnostic again:');
        console.log('   node scripts/analyze-git-remotes.js');
    }

    /**
     * Run the complete fix process
     */
    async runFix() {
        console.log('🚀 Starting Git remote configuration fix...\\n');

        try {
            // Check current status
            const status = this.checkCurrentStatus();
            if (!status) {
                console.log('❌ Cannot proceed - failed to check Git status');
                process.exit(1);
            }

            // If staging already has tracking, ask if user wants to proceed
            if (status.stagingTracking) {
                console.log(`\\n⚠️  Staging branch already has tracking: ${status.stagingTracking}`);
                const shouldProceed = await this.askConfirmation('Do you want to update the tracking?');
                if (!shouldProceed) {
                    console.log('👋 Exiting without changes');
                    this.rl.close();
                    return;
                }
            }

            // Fix staging branch tracking
            const trackingFixed = await this.fixStagingTracking(status);
            if (!trackingFixed) {
                console.log('❌ Failed to fix staging branch tracking');
                process.exit(1);
            }

            // Test connectivity
            const connectivityOK = await this.testPushConnectivity();
            if (!connectivityOK) {
                console.log('⚠️  Connectivity issues detected - manual verification needed');
            }

            // Optional cleanup
            await this.cleanupRemotes();

            // Success message and instructions
            console.log('\\n✅ Git remote configuration fix completed!');
            this.generateInstructions();

        } catch (error) {
            console.error('❌ Fix process failed:', error.message);
            process.exit(1);
        } finally {
            this.rl.close();
        }
    }
}

// Main execution
async function main() {
    const fixer = new GitRemoteFixer();
    await fixer.runFix();
}

if (require.main === module) {
    main();
}

module.exports = GitRemoteFixer;