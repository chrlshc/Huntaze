# Layout Cleanup and Validation System

This system automates the detection, removal, and validation of redundant layout files in the Next.js application. It helps maintain a clean codebase by identifying and safely removing layouts that only return `children` without adding any business logic, styling, or UI components.

## Table of Contents

- [Quick Start](#quick-start)
- [CLI Commands](#cli-commands)
- [Directory Structure](#directory-structure)
- [Common Scenarios](#common-scenarios)
- [Troubleshooting](#troubleshooting)
- [Git Hook Pre-Commit Validation](#git-hook-pre-commit-validation)
- [Advanced Usage](#advanced-usage)
- [API Reference](#api-reference)

## Quick Start

```bash
# 1. Install Git hooks
npm run hooks:install

# 2. Analyze your layouts
npm run layouts:analyze

# 3. Preview cleanup (dry-run)
npm run layouts:cleanup -- --dry-run

# 4. Perform actual cleanup
npm run layouts:cleanup

# 5. Validate build
npm run build:validate
```

## CLI Commands

### Layout Analysis

Analyze all layout files and categorize them as redundant, necessary, or requiring review.

```bash
# Basic analysis
npm run layouts:analyze

# Verbose output with detailed information
npm run layouts:analyze -- --verbose

# Output as JSON only (for scripting)
npm run layouts:analyze -- --json

# Save report to custom location
npm run layouts:analyze -- --output ./my-report.json
```

**Output:**
- Console summary with statistics
- JSON report saved to `.kiro/reports/layout-analysis.json`
- Categorized list of all layouts

### Layout Cleanup

Remove redundant layouts with automatic backup and validation.

```bash
# Dry-run (preview without making changes)
npm run layouts:cleanup -- --dry-run

# Full cleanup with backup and validation
npm run layouts:cleanup

# Cleanup without backup (not recommended)
npm run layouts:cleanup -- --no-backup

# Cleanup without build validation (faster, but risky)
npm run layouts:cleanup -- --skip-validation

# Verbose output
npm run layouts:cleanup -- --verbose

# Combine options
npm run layouts:cleanup -- --dry-run --verbose
```

**Options:**
- `--dry-run`: Simulate cleanup without making changes
- `--no-backup`: Skip creating backups (not recommended)
- `--skip-validation`: Skip build validation after each deletion
- `--verbose`: Show detailed progress and debug information

### Build Validation

Validate that the Next.js build succeeds and log results.

```bash
# Run build validation
npm run build:validate

# Validation runs automatically:
# - Before each commit (via Git hook)
# - After each layout deletion (during cleanup)
```

**Output:**
- Build success/failure status
- Build duration and statistics
- Error details with file locations
- Log saved to `.kiro/build-logs/`

### Git Hooks

Install and manage Git pre-commit hooks.

```bash
# Install pre-commit hook
npm run hooks:install

# Log a bypass (when using --no-verify)
npm run hooks:log-bypass

# Check bypass logs
cat .kiro/build-logs/bypass-log.jsonl
```

## Directory Structure

```
scripts/layout-cleanup/
├── utils/
│   ├── file-operations.ts    # File system utilities
│   ├── logger.ts              # Logging and progress tracking
│   └── index.ts               # Utility exports
├── analyze-layouts.ts         # Layout analysis script (to be implemented)
├── cleanup-layouts.ts         # Layout cleanup script (to be implemented)
├── validate-build.ts          # Build validation script (to be implemented)
├── tsconfig.json              # TypeScript configuration
└── README.md                  # This file

.kiro/
├── build-logs/                # Build validation logs
├── reports/                   # Analysis and cleanup reports
└── backups/
    └── layouts/               # Backup of deleted layouts (30 day retention)
```

## Utilities

### File Operations (`utils/file-operations.ts`)

Provides utilities for:
- Reading, writing, and deleting files
- Finding files matching patterns
- Creating and restoring backups
- Managing directories
- Cleaning up old backups

### Logger (`utils/logger.ts`)

Provides:
- Structured logging with levels (DEBUG, INFO, WARN, ERROR, SUCCESS)
- Console output with colors and icons
- File-based logging with JSON format
- Log rotation (max 100MB)
- Progress bar for long-running operations

## Usage

### File Operations Example

```typescript
import { readFile, createBackup, findFiles } from './utils/file-operations';

// Find all layout files
const layouts = await findFiles('app', /layout\.tsx$/);

// Create backup before deletion
const backupPath = await createBackup(
  'app/some/layout.tsx',
  '.kiro/backups/layouts'
);

// Restore if needed
await restoreFromBackup(backupPath, 'app/some/layout.tsx');
```

### Logger Example

```typescript
import { Logger, ProgressBar } from './utils/logger';

// Create logger
const logger = new Logger('.kiro/build-logs', true);
await logger.initialize();

// Log messages
await logger.info('Starting analysis...');
await logger.success('Analysis complete!');
await logger.error('Build failed', { error: 'details' });

// Progress bar
const progress = new ProgressBar(100, 'Analyzing');
for (let i = 0; i < 100; i++) {
  progress.increment();
  await someWork();
}
```

## Common Scenarios

### Scenario 1: First-Time Cleanup

You want to clean up all redundant layouts in your codebase.

```bash
# Step 1: Analyze to see what will be removed
npm run layouts:analyze

# Step 2: Review the report
cat .kiro/reports/layout-analysis.json

# Step 3: Dry-run to preview changes
npm run layouts:cleanup -- --dry-run

# Step 4: Perform actual cleanup
npm run layouts:cleanup

# Step 5: Verify everything works
npm run build
```

### Scenario 2: Regular Maintenance

You want to check for new redundant layouts periodically.

```bash
# Quick analysis and cleanup
npm run layouts:analyze && npm run layouts:cleanup -- --dry-run

# If dry-run looks good, run actual cleanup
npm run layouts:cleanup
```

### Scenario 3: Pre-Deployment Check

Before deploying, ensure no redundant layouts exist.

```bash
# Analyze and fail if redundant layouts found
npm run layouts:analyze -- --json | jq '.redundant | length' | grep -q '^0$' || exit 1

# Or use in CI/CD pipeline
if [ $(npm run layouts:analyze -- --json | jq '.redundant | length') -gt 0 ]; then
  echo "❌ Redundant layouts found! Run cleanup before deploying."
  exit 1
fi
```

### Scenario 4: Emergency Commit (Build Failing)

You need to commit urgently but the build is failing.

```bash
# Option 1: Fix the build (recommended)
npm run build:validate
# Fix the errors shown
git add .
git commit -m "fix: resolve build errors"

# Option 2: Bypass validation (emergency only)
git commit --no-verify -m "fix: emergency hotfix"
npm run hooks:log-bypass  # Log the bypass for tracking
```

### Scenario 5: Restore Deleted Layout

You accidentally deleted a layout and need to restore it.

```bash
# Find the backup
ls -la .kiro/backups/layouts/

# Restore from backup (replace with actual backup filename)
cp .kiro/backups/layouts/2025-11-17/app-analytics-layout-1731844800000.tsx app/analytics/layout.tsx

# Verify build works
npm run build:validate
```

### Scenario 6: Debugging Build Failures

The build is failing and you need to understand why.

```bash
# Run validation to see errors
npm run build:validate

# Check detailed logs
cat .kiro/build-logs/latest.log

# Check recent build history
ls -lt .kiro/build-logs/ | head -10

# Search for specific error in logs
grep -r "error message" .kiro/build-logs/
```

## Troubleshooting

### Problem: "Build validation failed" during cleanup

**Symptoms:**
- Cleanup stops after deleting a layout
- Error message shows build failure
- Layout is automatically restored from backup

**Solution:**
```bash
# 1. Check which layout caused the issue
cat .kiro/build-logs/latest.log

# 2. The layout was automatically restored, so your code is safe

# 3. Manually review the layout that caused issues
# It may have been incorrectly categorized as redundant

# 4. Run analysis again to see updated categorization
npm run layouts:analyze -- --verbose
```

### Problem: "Cannot find backup" error

**Symptoms:**
- Trying to restore a layout but backup doesn't exist
- Error: "Backup file not found"

**Solution:**
```bash
# 1. Check if backups exist
ls -la .kiro/backups/layouts/

# 2. If no backups, check Git history
git log --all --full-history -- "app/**/layout.tsx"

# 3. Restore from Git
git checkout <commit-hash> -- path/to/layout.tsx

# 4. Enable backups for future cleanups (don't use --no-backup)
npm run layouts:cleanup  # Backups enabled by default
```

### Problem: Pre-commit hook blocks all commits

**Symptoms:**
- Every commit is blocked by the hook
- Build validation always fails
- Can't commit even after fixing errors

**Solution:**
```bash
# 1. Verify the build actually works
npm run build

# 2. If build succeeds but hook still blocks, check hook script
cat .husky/pre-commit

# 3. Reinstall the hook
npm run hooks:install

# 4. Test the hook
git commit --allow-empty -m "test hook"

# 5. If still failing, temporarily bypass and investigate
git commit --no-verify -m "investigate hook issue"
npm run hooks:log-bypass
```

### Problem: "Too many layouts marked as redundant"

**Symptoms:**
- Analysis shows many layouts as redundant
- You believe some should be kept
- Concerned about false positives

**Solution:**
```bash
# 1. Run verbose analysis to see why they're marked redundant
npm run layouts:analyze -- --verbose

# 2. Review specific layouts manually
cat app/some/path/layout.tsx

# 3. Layouts are marked redundant if they ONLY return children
# They're kept if they have:
#   - Imports (other than React)
#   - Hooks (useState, useEffect, etc.)
#   - Logic (if statements, function calls)
#   - Styling (className, style props)
#   - Wrapper components

# 4. Use dry-run to preview before actual deletion
npm run layouts:cleanup -- --dry-run

# 5. If a layout is incorrectly marked, it has business logic
# and should be preserved automatically
```

### Problem: Build is slow during cleanup

**Symptoms:**
- Cleanup takes a very long time
- Each layout deletion triggers a full build
- Want to speed up the process

**Solution:**
```bash
# Option 1: Skip validation (faster but risky)
npm run layouts:cleanup -- --skip-validation

# Then validate once at the end
npm run build:validate

# Option 2: Use Next.js build cache
# Ensure .next/cache/ is not deleted between builds

# Option 3: Clean up in smaller batches
# Manually delete a few layouts, then run:
npm run build:validate

# Option 4: Use dry-run to verify, then cleanup without validation
npm run layouts:cleanup -- --dry-run
# Review the list
npm run layouts:cleanup -- --skip-validation
# Validate once at the end
npm run build
```

### Problem: Backup directory is too large

**Symptoms:**
- `.kiro/backups/layouts/` is consuming too much disk space
- Old backups are not being cleaned up

**Solution:**
```bash
# 1. Check backup size
du -sh .kiro/backups/layouts/

# 2. Manually clean old backups (older than 30 days)
find .kiro/backups/layouts/ -type f -mtime +30 -delete

# 3. Clean empty directories
find .kiro/backups/layouts/ -type d -empty -delete

# 4. Backups are automatically cleaned during cleanup
# Run cleanup to trigger automatic cleanup
npm run layouts:cleanup -- --dry-run
```

### Problem: "Permission denied" errors

**Symptoms:**
- Cannot create backups
- Cannot delete layouts
- Cannot write logs

**Solution:**
```bash
# 1. Check directory permissions
ls -la .kiro/

# 2. Fix permissions
chmod -R u+w .kiro/

# 3. Ensure directories exist
mkdir -p .kiro/backups/layouts
mkdir -p .kiro/build-logs
mkdir -p .kiro/reports

# 4. Check if files are read-only
ls -la app/**/layout.tsx

# 5. Make layouts writable
find app -name "layout.tsx" -exec chmod u+w {} \;
```

### Problem: Analysis shows "review" category

**Symptoms:**
- Some layouts are marked as "review" instead of redundant/necessary
- Unsure whether to keep or delete them

**Solution:**
```bash
# 1. Run verbose analysis to see details
npm run layouts:analyze -- --verbose

# 2. Layouts marked "review" typically have:
#   - Only export const dynamic = 'force-dynamic'
#   - Minimal code that's ambiguous

# 3. Manually review each one
cat app/path/to/layout.tsx

# 4. Decision criteria:
#   - If it only has export const dynamic, it's likely redundant
#   - If it has any other logic, keep it
#   - If unsure, keep it (safer)

# 5. Manually delete if confirmed redundant
rm app/path/to/layout.tsx
npm run build:validate
```

## Requirements

- Node.js 18+
- TypeScript 5+
- Next.js 13+ (App Router)
- Git (for pre-commit hooks)

## Git Hook Pre-Commit Validation

The system includes a Git pre-commit hook that automatically validates builds before allowing commits. This ensures that only code that successfully builds is committed to the repository.

### How It Works

When you run `git commit`, the pre-commit hook:
1. Runs `npm run build:validate` to check if the build succeeds
2. If the build passes (exit code 0), the commit proceeds
3. If the build fails (exit code 1), the commit is blocked

### Installation

The Git hook is automatically installed when you run:

```bash
npm run hooks:install
```

This command:
- Initializes Husky (if not already done)
- Creates the `.husky/pre-commit` hook
- Makes the hook executable

### Bypassing the Hook

⚠️ **WARNING: Bypassing validation is not recommended and should only be used in emergencies.**

If you absolutely need to commit without validation, use:

```bash
git commit --no-verify -m "your commit message"
```

**When to bypass:**
- Emergency hotfixes that need immediate deployment
- Temporary work-in-progress commits on feature branches
- Known build issues that are being actively worked on

**Important notes:**
- All bypass attempts are logged to `.kiro/build-logs/`
- Frequent bypassing may indicate underlying issues that need attention
- Never bypass validation for commits to `main` or `staging` branches
- Always run a full build validation before merging to production

### Bypass Logging

When you bypass the pre-commit hook, you should log the bypass for tracking purposes:

```bash
# Bypass and log in one command
git commit --no-verify -m "your message" && npm run hooks:log-bypass
```

The bypass log records:
- Timestamp of the bypass
- Branch name
- Last commit message
- User who performed the bypass
- Reason for bypass

These logs are stored in `.kiro/build-logs/bypass-log.jsonl` and help track validation bypasses to identify patterns that may need addressing.

**Best Practice:** Always log your bypasses to maintain accountability and help the team understand when and why validation is being skipped.

### Troubleshooting

If the pre-commit hook blocks your commit:

1. **Check the error message** - The hook displays which files have errors
2. **Review build logs** - Check `.kiro/build-logs/latest.log` for detailed error information
3. **Fix the errors** - Address the build failures before committing
4. **Test locally** - Run `npm run build:validate` to verify your fixes
5. **Commit again** - Once the build passes, your commit will succeed

### Disabling the Hook (Not Recommended)

If you need to temporarily disable the hook for development:

```bash
# Remove the pre-commit hook
rm .husky/pre-commit

# Re-enable later by running
npm run hooks:install
```

**Note:** This should only be done on local development branches, never on shared branches.

## Advanced Usage

### Custom Analysis Filters

You can modify the analyzer to use custom detection logic:

```typescript
import { LayoutAnalyzer } from './scripts/layout-cleanup/layout-analyzer';

const analyzer = new LayoutAnalyzer();

// Analyze with custom filter
const report = await analyzer.analyzeAll();
const customFiltered = report.redundant.filter(layout => 
  layout.path.includes('specific-directory')
);
```

### Programmatic Usage

Use the cleanup system in your own scripts:

```typescript
import { LayoutCleaner } from './scripts/layout-cleanup/layout-cleaner';
import { BuildValidator } from './scripts/layout-cleanup/build-validator';

// Custom cleanup
const cleaner = new LayoutCleaner({
  dryRun: false,
  backup: true,
  validate: true,
  verbose: true
});

const result = await cleaner.cleanup();
console.log(`Removed ${result.removed.length} layouts`);

// Custom validation
const validator = new BuildValidator();
const buildResult = await validator.validate();
if (!buildResult.success) {
  console.error('Build failed:', buildResult.errors);
}
```

### CI/CD Integration

Add to your CI/CD pipeline:

```yaml
# .github/workflows/validate-layouts.yml
name: Validate Layouts

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Analyze layouts
        run: npm run layouts:analyze
      
      - name: Check for redundant layouts
        run: |
          REDUNDANT=$(npm run layouts:analyze -- --json | jq '.redundant | length')
          if [ "$REDUNDANT" -gt 0 ]; then
            echo "❌ Found $REDUNDANT redundant layouts"
            exit 1
          fi
      
      - name: Validate build
        run: npm run build:validate
```

### Custom Backup Location

Modify backup location in your cleanup script:

```typescript
import { createBackup } from './scripts/layout-cleanup/utils/file-operations';

// Custom backup location
const backupPath = await createBackup(
  'app/some/layout.tsx',
  '/custom/backup/path'
);
```

## API Reference

### LayoutAnalyzer

Analyzes layout files and categorizes them.

```typescript
class LayoutAnalyzer {
  constructor();
  
  // Analyze all layouts in the app directory
  async analyzeAll(): Promise<AnalysisReport>;
  
  // Analyze a specific layout file
  async analyzeFile(path: string): Promise<LayoutAnalysis>;
}

interface AnalysisReport {
  total: number;
  redundant: LayoutAnalysis[];
  necessary: LayoutAnalysis[];
  review: LayoutAnalysis[];
  timestamp: string;
}

interface LayoutAnalysis {
  path: string;
  category: 'redundant' | 'necessary' | 'review';
  reason: string;
  hasLogic: boolean;
  hasStyles: boolean;
  hasImports: boolean;
  childrenOnly: boolean;
}
```

### LayoutCleaner

Removes redundant layouts with backup and validation.

```typescript
class LayoutCleaner {
  constructor(options: CleanupOptions);
  
  // Perform cleanup operation
  async cleanup(): Promise<CleanupResult>;
}

interface CleanupOptions {
  dryRun: boolean;      // Simulate without making changes
  backup: boolean;      // Create backups before deletion
  validate: boolean;    // Run build validation after each deletion
  verbose: boolean;     // Show detailed output
}

interface CleanupResult {
  removed: string[];    // Successfully removed layouts
  failed: string[];     // Failed to remove (build errors)
  restored: string[];   // Restored from backup after failure
  buildSuccess: boolean;
  duration: number;     // Total duration in seconds
}
```

### BuildValidator

Validates Next.js builds and logs results.

```typescript
class BuildValidator {
  constructor();
  
  // Run build validation
  async validate(): Promise<BuildResult>;
}

interface BuildResult {
  success: boolean;
  duration: number;
  errors: BuildError[];
  warnings: BuildWarning[];
  timestamp: string;
  stats: BuildStats;
}

interface BuildError {
  file: string;
  line: number;
  column: number;
  message: string;
  type: 'layout' | 'component' | 'type' | 'other';
}

interface BuildStats {
  pages: number;
  routes: number;
  staticPages: number;
  serverPages: number;
  edgePages: number;
  bundleSize: number;
}
```

### File Operations

Utility functions for file management.

```typescript
// Read file content
async function readFile(path: string): Promise<string>;

// Write file content
async function writeFile(path: string, content: string): Promise<void>;

// Delete file
async function deleteFile(path: string): Promise<void>;

// Find files matching pattern
async function findFiles(dir: string, pattern: RegExp): Promise<string[]>;

// Create backup
async function createBackup(
  sourcePath: string,
  backupDir: string
): Promise<string>;

// Restore from backup
async function restoreFromBackup(
  backupPath: string,
  targetPath: string
): Promise<void>;

// Clean old backups (older than days)
async function cleanOldBackups(
  backupDir: string,
  days: number
): Promise<number>;
```

### Logger

Structured logging with console and file output.

```typescript
class Logger {
  constructor(logDir: string, verbose: boolean);
  
  async initialize(): Promise<void>;
  async debug(message: string, data?: any): Promise<void>;
  async info(message: string, data?: any): Promise<void>;
  async warn(message: string, data?: any): Promise<void>;
  async error(message: string, data?: any): Promise<void>;
  async success(message: string, data?: any): Promise<void>;
  async close(): Promise<void>;
}

class ProgressBar {
  constructor(total: number, label: string);
  
  increment(amount?: number): void;
  finish(): void;
}
```

## Configuration

### TypeScript Configuration

TypeScript configuration is provided in `scripts/layout-cleanup/tsconfig.json` and extends the root project configuration.

### Environment Variables

No environment variables are required. All configuration is done through CLI flags.

### Customization

To customize behavior, modify the following files:
- `scripts/layout-cleanup/layout-analyzer.ts` - Detection logic
- `scripts/layout-cleanup/layout-cleaner.ts` - Cleanup behavior
- `scripts/layout-cleanup/build-validator.ts` - Validation logic

## Logging

All operations are logged to `.kiro/build-logs/` with:
- Timestamped log files (YYYY-MM-DD-HH-mm-ss.log)
- JSON format for easy parsing
- Automatic log rotation (100MB limit)
- Symlink to `latest.log` for quick access
- Structured log entries with level, timestamp, message, and data

**Log Levels:**
- `DEBUG`: Detailed diagnostic information
- `INFO`: General informational messages
- `WARN`: Warning messages for potential issues
- `ERROR`: Error messages for failures
- `SUCCESS`: Success messages for completed operations

**Log Format:**
```json
{
  "level": "INFO",
  "timestamp": "2025-11-17T10:30:00.000Z",
  "message": "Layout analysis complete",
  "data": {
    "total": 50,
    "redundant": 12,
    "necessary": 35,
    "review": 3
  }
}
```

## Backups

Layout backups are stored in `.kiro/backups/layouts/` with:
- Timestamped filenames: `{original-path}-{timestamp}.tsx`
- Organized by date: `YYYY-MM-DD/`
- 30-day retention policy
- Automatic cleanup of old backups during cleanup operations

**Backup Naming Convention:**
```
.kiro/backups/layouts/2025-11-17/app-analytics-layout-1731844800000.tsx
                      └─ date ─┘ └──────── original path ────────┘└─ timestamp ─┘
```

**Backup Retention:**
- Backups older than 30 days are automatically deleted
- Manual cleanup: `find .kiro/backups/layouts/ -type f -mtime +30 -delete`
- Backup size is typically 1-5KB per layout file

## Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review build logs in `.kiro/build-logs/latest.log`
3. Run analysis with `--verbose` flag for detailed output
4. Check the [Common Scenarios](#common-scenarios) for examples

## License

This tool is part of the Huntaze project and follows the same license.
