#!/usr/bin/env node

/**
 * Git Hooks Setup Script for Amplify Environment Variables
 * Installs and configures Git hooks for configuration validation
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class GitHooksSetup {
  constructor() {
    this.hooksDir = '.git/hooks';
    this.scriptsDir = 'scripts/amplify-env-vars';
  }

  /**
   * Check if we're in a Git repository
   */
  isGitRepository() {
    try {
      execSync('git rev-parse --git-dir', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Create pre-commit hook
   */
  createPreCommitHook() {
    const hookPath = path.join(this.hooksDir, 'pre-commit');
    const hookContent = `#!/bin/sh
#
# Pre-commit hook for Amplify Environment Variables validation
# This hook validates configuration files before they are committed
#

echo "🔍 Validating Amplify environment variable configurations..."

# Run the pre-commit validation script
node ${this.scriptsDir}/pre-commit-validation.js

exit_code=$?

if [ $exit_code -ne 0 ]; then
  echo ""
  echo "❌ Pre-commit validation failed!"
  echo "Please fix the configuration issues above and try committing again."
  echo ""
  echo "Helpful commands:"
  echo "  - Validate specific file: node ${this.scriptsDir}/validate-env-vars.js <file>"
  echo "  - Check templates: ls ${this.scriptsDir}/../config/amplify-env-vars/*-template.yaml"
  echo "  - Read documentation: cat ${this.scriptsDir}/../config/amplify-env-vars/README.md"
  echo ""
  exit 1
fi

echo "✅ Configuration validation passed!"
exit 0
`;

    fs.writeFileSync(hookPath, hookContent, { mode: 0o755 });
    console.log('✅ Pre-commit hook installed');
  }

  /**
   * Create commit-msg hook for commit message validation
   */
  createCommitMsgHook() {
    const hookPath = path.join(this.hooksDir, 'commit-msg');
    const hookContent = `#!/bin/sh
#
# Commit message hook for Amplify Environment Variables
# Validates commit message format for configuration changes
#

commit_file=$1
commit_message=$(cat "$commit_file")

# Check if this is a configuration change
if echo "$commit_message" | grep -q "config\\|amplify\\|env"; then
  # Validate commit message format
  if ! echo "$commit_message" | grep -qE "^(config|feat|fix|docs|style|refactor|test|chore)(\\(.+\\))?: .+"; then
    echo "❌ Invalid commit message format for configuration changes!"
    echo ""
    echo "Configuration changes should follow conventional commit format:"
    echo "  config: description of configuration change"
    echo "  feat(env): add new environment variables"
    echo "  fix(config): correct database URL format"
    echo ""
    echo "Your message: $commit_message"
    echo ""
    exit 1
  fi
fi

exit 0
`;

    fs.writeFileSync(hookPath, hookContent, { mode: 0o755 });
    console.log('✅ Commit message hook installed');
  }

  /**
   * Create post-commit hook for change tracking
   */
  createPostCommitHook() {
    const hookPath = path.join(this.hooksDir, 'post-commit');
    const hookContent = `#!/bin/sh
#
# Post-commit hook for Amplify Environment Variables
# Tracks configuration changes in change history
#

# Get the commit hash
commit_hash=$(git rev-parse HEAD)

# Check if any configuration files were changed
config_files=$(git diff-tree --no-commit-id --name-only -r $commit_hash | grep "config/amplify-env-vars")

if [ -n "$config_files" ]; then
  echo "📝 Configuration files changed in commit $commit_hash"
  echo "$config_files" | while read file; do
    echo "   - $file"
  done
  
  # Update change history (optional, requires Node.js script)
  if [ -f "${this.scriptsDir}/update-change-history.js" ]; then
    node ${this.scriptsDir}/update-change-history.js "$commit_hash" || true
  fi
fi
`;

    fs.writeFileSync(hookPath, hookContent, { mode: 0o755 });
    console.log('✅ Post-commit hook installed');
  }

  /**
   * Backup existing hooks
   */
  backupExistingHooks() {
    const hooks = ['pre-commit', 'commit-msg', 'post-commit'];
    const backupDir = path.join(this.hooksDir, 'backup');

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    hooks.forEach(hook => {
      const hookPath = path.join(this.hooksDir, hook);
      if (fs.existsSync(hookPath)) {
        const backupPath = path.join(backupDir, `${hook}.backup.${Date.now()}`);
        fs.copyFileSync(hookPath, backupPath);
        console.log(`📋 Backed up existing ${hook} hook to ${backupPath}`);
      }
    });
  }

  /**
   * Install all Git hooks
   */
  installHooks(options = {}) {
    console.log('🔧 Setting up Git hooks for Amplify environment variables...\n');

    // Check if in Git repository
    if (!this.isGitRepository()) {
      console.error('❌ Not in a Git repository. Please run this from the project root.');
      process.exit(1);
    }

    // Check if hooks directory exists
    if (!fs.existsSync(this.hooksDir)) {
      console.error('❌ Git hooks directory not found. This might not be a Git repository.');
      process.exit(1);
    }

    // Backup existing hooks
    if (options.backup !== false) {
      this.backupExistingHooks();
    }

    // Install hooks
    try {
      this.createPreCommitHook();
      
      if (options.commitMsg !== false) {
        this.createCommitMsgHook();
      }
      
      if (options.postCommit !== false) {
        this.createPostCommitHook();
      }

      console.log('\n✅ Git hooks installed successfully!');
      console.log('\nHooks installed:');
      console.log('  - pre-commit: Validates configuration files before commit');
      console.log('  - commit-msg: Validates commit message format');
      console.log('  - post-commit: Tracks configuration changes');
      
      console.log('\nTo test the hooks:');
      console.log('  1. Make changes to a configuration file');
      console.log('  2. Stage the changes: git add config/amplify-env-vars/example.yaml');
      console.log('  3. Try to commit: git commit -m "config: update example configuration"');
      
    } catch (error) {
      console.error('❌ Failed to install Git hooks:', error.message);
      process.exit(1);
    }
  }

  /**
   * Uninstall Git hooks
   */
  uninstallHooks() {
    console.log('🗑️  Removing Amplify environment variables Git hooks...\n');

    const hooks = ['pre-commit', 'commit-msg', 'post-commit'];
    
    hooks.forEach(hook => {
      const hookPath = path.join(this.hooksDir, hook);
      if (fs.existsSync(hookPath)) {
        // Check if it's our hook
        const content = fs.readFileSync(hookPath, 'utf8');
        if (content.includes('Amplify Environment Variables')) {
          fs.unlinkSync(hookPath);
          console.log(`✅ Removed ${hook} hook`);
        } else {
          console.log(`⚠️  ${hook} hook exists but doesn't appear to be ours - skipping`);
        }
      } else {
        console.log(`ℹ️  ${hook} hook not found`);
      }
    });

    console.log('\n✅ Git hooks removed successfully!');
  }

  /**
   * Show status of Git hooks
   */
  showStatus() {
    console.log('📊 Git Hooks Status for Amplify Environment Variables\n');

    if (!this.isGitRepository()) {
      console.log('❌ Not in a Git repository');
      return;
    }

    const hooks = ['pre-commit', 'commit-msg', 'post-commit'];
    
    hooks.forEach(hook => {
      const hookPath = path.join(this.hooksDir, hook);
      if (fs.existsSync(hookPath)) {
        const content = fs.readFileSync(hookPath, 'utf8');
        if (content.includes('Amplify Environment Variables')) {
          console.log(`✅ ${hook}: Installed and configured`);
        } else {
          console.log(`⚠️  ${hook}: Exists but not configured for Amplify env vars`);
        }
      } else {
        console.log(`❌ ${hook}: Not installed`);
      }
    });

    // Check backup directory
    const backupDir = path.join(this.hooksDir, 'backup');
    if (fs.existsSync(backupDir)) {
      const backups = fs.readdirSync(backupDir);
      if (backups.length > 0) {
        console.log(`\n📋 Backup hooks found: ${backups.length} files`);
      }
    }
  }
}

// CLI interface
if (require.main === module) {
  const { Command } = require('commander');
  const program = new Command();

  program
    .name('setup-git-hooks')
    .description('Setup Git hooks for Amplify environment variables')
    .version('1.0.0');

  program
    .command('install')
    .description('Install Git hooks')
    .option('--no-backup', 'Skip backing up existing hooks')
    .option('--no-commit-msg', 'Skip commit message hook')
    .option('--no-post-commit', 'Skip post-commit hook')
    .action((options) => {
      const setup = new GitHooksSetup();
      setup.installHooks(options);
    });

  program
    .command('uninstall')
    .description('Uninstall Git hooks')
    .action(() => {
      const setup = new GitHooksSetup();
      setup.uninstallHooks();
    });

  program
    .command('status')
    .description('Show Git hooks status')
    .action(() => {
      const setup = new GitHooksSetup();
      setup.showStatus();
    });

  program.parse();

  // Show help if no command provided
  if (!process.argv.slice(2).length) {
    program.outputHelp();
  }
}

module.exports = { GitHooksSetup };