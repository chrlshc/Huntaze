#!/usr/bin/env node

/**
 * Git Hooks Setup Script
 * Sets up pre-commit hooks for dependency validation
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class GitHooksSetup {
  constructor() {
    this.huskyDir = path.join(process.cwd(), '.husky');
    this.preCommitPath = path.join(this.huskyDir, 'pre-commit');
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      reset: '\x1b[0m'
    };
    
    const color = colors[type] || colors.info;
    console.log(`${color}${message}${colors.reset}`);
  }

  checkGitRepo() {
    try {
      execSync('git rev-parse --git-dir', { stdio: 'pipe' });
      return true;
    } catch (error) {
      this.log('❌ Not in a git repository', 'error');
      return false;
    }
  }

  installHusky() {
    try {
      this.log('📦 Installing Husky...');
      
      // Check if husky is already installed
      try {
        execSync('npx husky --version', { stdio: 'pipe' });
        this.log('✅ Husky is already available', 'success');
      } catch (error) {
        // Install husky as dev dependency
        execSync('npm install --save-dev husky', { stdio: 'inherit' });
      }
      
      // Initialize husky
      execSync('npx husky init', { stdio: 'pipe' });
      this.log('✅ Husky initialized', 'success');
      
      return true;
    } catch (error) {
      this.log(`❌ Failed to install Husky: ${error.message}`, 'error');
      return false;
    }
  }

  setupPreCommitHook() {
    try {
      this.log('🔧 Setting up pre-commit hook...');
      
      const preCommitContent = `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Check for dependency conflicts before commit
echo "🔍 Checking for dependency conflicts..."
npm run precommit:deps

# If dependency check passes, continue with other checks
if [ $? -eq 0 ]; then
  echo "✅ Dependency validation passed"
else
  echo "❌ Dependency validation failed - commit blocked"
  exit 1
fi`;

      // Ensure .husky directory exists
      if (!fs.existsSync(this.huskyDir)) {
        fs.mkdirSync(this.huskyDir, { recursive: true });
      }

      // Write pre-commit hook
      fs.writeFileSync(this.preCommitPath, preCommitContent);
      
      // Make it executable
      try {
        execSync(`chmod +x "${this.preCommitPath}"`, { stdio: 'pipe' });
      } catch (error) {
        // chmod might not work on Windows, but that's okay
        this.log('⚠️ Could not make pre-commit hook executable (Windows?)', 'warning');
      }
      
      this.log('✅ Pre-commit hook configured', 'success');
      return true;
    } catch (error) {
      this.log(`❌ Failed to setup pre-commit hook: ${error.message}`, 'error');
      return false;
    }
  }

  setupManualHook() {
    this.log('📝 Setting up manual git hook (fallback)...');
    
    const gitHooksDir = path.join(process.cwd(), '.git', 'hooks');
    const manualPreCommitPath = path.join(gitHooksDir, 'pre-commit');
    
    if (!fs.existsSync(gitHooksDir)) {
      this.log('❌ Git hooks directory not found', 'error');
      return false;
    }
    
    const hookContent = `#!/bin/sh
# Dependency validation pre-commit hook
echo "🔍 Validating dependencies..."
npm run precommit:deps
exit $?`;
    
    try {
      fs.writeFileSync(manualPreCommitPath, hookContent);
      
      try {
        execSync(`chmod +x "${manualPreCommitPath}"`, { stdio: 'pipe' });
      } catch (error) {
        // Ignore chmod errors on Windows
      }
      
      this.log('✅ Manual git hook configured', 'success');
      return true;
    } catch (error) {
      this.log(`❌ Failed to setup manual hook: ${error.message}`, 'error');
      return false;
    }
  }

  testHook() {
    this.log('🧪 Testing dependency validation...');
    
    try {
      execSync('npm run validate:dependencies', { stdio: 'inherit' });
      this.log('✅ Dependency validation test passed', 'success');
      return true;
    } catch (error) {
      this.log('⚠️ Dependency validation test failed - please check your dependencies', 'warning');
      return false;
    }
  }

  displayInstructions() {
    this.log('\n🎉 Git hooks setup complete!', 'success');
    this.log('\n📋 Available commands:', 'info');
    this.log('  npm run validate:dependencies  - Full dependency validation');
    this.log('  npm run check:conflicts       - Quick conflict check');
    this.log('  npm run precommit:deps        - Pre-commit validation');
    
    this.log('\n🔧 How it works:', 'info');
    this.log('  • Pre-commit hook runs automatically before each commit');
    this.log('  • Validates React and Three.js compatibility');
    this.log('  • Blocks commits if dependency conflicts are detected');
    this.log('  • Provides clear error messages and solutions');
    
    this.log('\n💡 Manual validation:', 'info');
    this.log('  Run "npm run validate:dependencies" anytime to check dependencies');
  }

  async run() {
    this.log('🚀 Setting up dependency validation git hooks...');
    
    if (!this.checkGitRepo()) {
      return false;
    }
    
    // Try Husky first, fallback to manual hook
    let hookSetup = false;
    
    if (this.installHusky()) {
      hookSetup = this.setupPreCommitHook();
    }
    
    if (!hookSetup) {
      this.log('⚠️ Husky setup failed, trying manual git hook...', 'warning');
      hookSetup = this.setupManualHook();
    }
    
    if (!hookSetup) {
      this.log('❌ Could not setup git hooks', 'error');
      return false;
    }
    
    // Test the validation
    this.testHook();
    
    this.displayInstructions();
    return true;
  }
}

// Run if called directly
if (require.main === module) {
  const setup = new GitHooksSetup();
  setup.run().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });
}

module.exports = GitHooksSetup;